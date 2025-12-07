import os
import time
import threading
import queue
import json
import functools
import logging
from enum import Enum
from typing import List, Optional

import numpy as np
from websockets.sync.server import serve
from websockets.exceptions import ConnectionClosed, InvalidUpgrade, InvalidMessage
from whisper_live.vad import VoiceActivityDetector
from whisper_live.backend.base import ServeClientBase
from whisper_live.preprocessing.audio_processor import AudioProcessor

# Configure logging - suppress noisy WebSocket handshake errors
# Use INFO level for production, DEBUG for troubleshooting
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Filter out harmless WebSocket handshake errors (browsers/tools trying to connect incorrectly)
class WebSocketErrorFilter(logging.Filter):
    def filter(self, record):
        # Suppress common harmless WebSocket handshake errors
        error_msg = str(record.getMessage())
        if any(phrase in error_msg for phrase in [
            'invalid Connection header',
            'did not receive a valid HTTP request',
            'connection closed while reading HTTP request',
            'stream ends after',
            'opening handshake failed'
        ]):
            return False  # Don't log this
        return True  # Log everything else

# Apply filter to websockets logger
websockets_logger = logging.getLogger('websockets.server')
websockets_logger.addFilter(WebSocketErrorFilter())

class ClientManager:
    def __init__(self, max_clients=4, max_connection_time=600):
        """
        Initializes the ClientManager with specified limits on client connections and connection durations.

        Args:
            max_clients (int, optional): The maximum number of simultaneous client connections allowed. Defaults to 4.
            max_connection_time (int, optional): The maximum duration (in seconds) a client can stay connected. Defaults
                                                 to 600 seconds (10 minutes).
        """
        self.clients = {}
        self.start_times = {}
        self.max_clients = max_clients
        self.max_connection_time = max_connection_time

    def add_client(self, websocket, client):
        """
        Adds a client and their connection start time to the tracking dictionaries.

        Args:
            websocket: The websocket associated with the client to add.
            client: The client object to be added and tracked.
        """
        self.clients[websocket] = client
        self.start_times[websocket] = time.time()

    def get_client(self, websocket):
        """
        Retrieves a client associated with the given websocket.

        Args:
            websocket: The websocket associated with the client to retrieve.

        Returns:
            The client object if found, False otherwise.
        """
        if websocket in self.clients:
            return self.clients[websocket]
        return False

    def remove_client(self, websocket):
        """
        Removes a client and their connection start time from the tracking dictionaries. Performs cleanup on the
        client if necessary.

        Args:
            websocket: The websocket associated with the client to be removed.
        """
        client = self.clients.pop(websocket, None)
        if client:
            client.cleanup()
        self.start_times.pop(websocket, None)

    def get_wait_time(self):
        """
        Calculates the estimated wait time for new clients based on the remaining connection times of current clients.

        Returns:
            The estimated wait time in minutes for new clients to connect. Returns 0 if there are available slots.
        """
        wait_time = None
        for start_time in self.start_times.values():
            current_client_time_remaining = self.max_connection_time - (time.time() - start_time)
            if wait_time is None or current_client_time_remaining < wait_time:
                wait_time = current_client_time_remaining
        return wait_time / 60 if wait_time is not None else 0

    def is_server_full(self, websocket, options):
        """
        Checks if the server is at its maximum client capacity and sends a wait message to the client if necessary.

        Args:
            websocket: The websocket of the client attempting to connect.
            options: A dictionary of options that may include the client's unique identifier.

        Returns:
            True if the server is full, False otherwise.
        """
        if len(self.clients) >= self.max_clients:
            wait_time = self.get_wait_time()
            response = {"uid": options["uid"], "status": "WAIT", "message": wait_time}
            websocket.send(json.dumps(response))
            return True
        return False

    def is_client_timeout(self, websocket):
        """
        Checks if a client has exceeded the maximum allowed connection time and disconnects them if so, issuing a warning.

        Args:
            websocket: The websocket associated with the client to check.

        Returns:
            True if the client's connection time has exceeded the maximum limit, False otherwise.
        """
        # Check if websocket is tracked (client was successfully added)
        if websocket not in self.start_times:
            return False  # Client not tracked, can't timeout
        
        elapsed_time = time.time() - self.start_times[websocket]
        if elapsed_time >= self.max_connection_time:
            if websocket in self.clients and self.clients[websocket]:
                self.clients[websocket].disconnect()
                logging.warning(f"Client with uid '{self.clients[websocket].client_uid}' disconnected due to overtime.")
            return True
        return False


class BackendType(Enum):
    FASTER_WHISPER = "faster_whisper"
    TENSORRT = "tensorrt"
    OPENVINO = "openvino"

    @staticmethod
    def valid_types() -> List[str]:
        return [backend_type.value for backend_type in BackendType]

    @staticmethod
    def is_valid(backend: str) -> bool:
        return backend in BackendType.valid_types()

    def is_faster_whisper(self) -> bool:
        return self == BackendType.FASTER_WHISPER

    def is_tensorrt(self) -> bool:
        return self == BackendType.TENSORRT
    
    def is_openvino(self) -> bool:
        return self == BackendType.OPENVINO


class TranscriptionServer:
    RATE = 16000

    def __init__(self):
        self.client_manager = None
        self.no_voice_activity_chunks = 0
        self.use_vad = True
        self.single_model = False

        # Initialize audio processor with AEC for hybrid echo cancellation
        # Check environment variable to enable/disable AEC
        aec_enabled = os.environ.get('WHISPER_LIVE_AEC_ENABLED', 'true').lower() == 'true'
        self.audio_processor = AudioProcessor(sample_rate=self.RATE, enable_aec=aec_enabled)
        if aec_enabled and self.audio_processor.aec_processor and self.audio_processor.aec_processor.is_enabled():
            logging.info("🎯 Hybrid AEC enabled - complementing browser AEC with server-side processing")
        elif not aec_enabled:
            logging.info("🔇 Server AEC disabled via WHISPER_LIVE_AEC_ENABLED=false - using browser AEC only")
        else:
            logging.warning("⚠️ Server AEC not available - relying on browser AEC only")

    def initialize_client(
        self, websocket, options, faster_whisper_custom_model_path,
        whisper_tensorrt_path, trt_multilingual, trt_py_session=False,
    ) -> bool:
        """
        Initialize a client connection.
        
        Returns:
            True if client was successfully initialized, False otherwise
        """
        client: Optional[ServeClientBase] = None

        # Check if client wants translation
        enable_translation = options.get("enable_translation", False)
        
        # Create translation queue if translation is enabled
        translation_queue = None
        translation_client = None
        translation_thread = None
        
        if enable_translation:
            target_language = options.get("target_language", "fr")
            translation_queue = queue.Queue()
            from whisper_live.backend.translation_backend import ServeClientTranslation
            translation_client = ServeClientTranslation(
                client_uid=options["uid"],
                websocket=websocket,
                translation_queue=translation_queue,
                target_language=target_language,
                send_last_n_segments=options.get("send_last_n_segments", 10)
            )
            
            # Start translation thread
            translation_thread = threading.Thread(
                target=translation_client.speech_to_text,
                daemon=True
            )
            translation_thread.start()
            
            logging.info(f"Translation enabled for client {options['uid']} with target language: {target_language}")

        if self.backend.is_tensorrt():
            try:
                from whisper_live.backend.trt_backend import ServeClientTensorRT
                client = ServeClientTensorRT(
                    websocket,
                    multilingual=trt_multilingual,
                    language=options["language"],
                    task=options["task"],
                    client_uid=options["uid"],
                    model=whisper_tensorrt_path,
                    single_model=self.single_model,
                    use_py_session=trt_py_session,
                    send_last_n_segments=options.get("send_last_n_segments", 10),
                    no_speech_thresh=options.get("no_speech_thresh", 0.45),
                    clip_audio=options.get("clip_audio", False),
                    same_output_threshold=options.get("same_output_threshold", 10),
                )
                logging.info("Running TensorRT backend.")
            except Exception as e:
                logging.error(f"TensorRT-LLM not supported: {e}")
                self.client_uid = options["uid"]
                websocket.send(json.dumps({
                    "uid": self.client_uid,
                    "status": "WARNING",
                    "message": "TensorRT-LLM not supported on Server yet. "
                               "Reverting to available backend: 'faster_whisper'"
                }))
                self.backend = BackendType.FASTER_WHISPER
        
        if self.backend.is_openvino():
            try:
                from whisper_live.backend.openvino_backend import ServeClientOpenVINO
                client = ServeClientOpenVINO(
                    websocket,
                    language=options["language"],
                    task=options["task"],
                    client_uid=options["uid"],
                    model=options["model"],
                    single_model=self.single_model,
                    send_last_n_segments=options.get("send_last_n_segments", 10),
                    no_speech_thresh=options.get("no_speech_thresh", 0.45),
                    clip_audio=options.get("clip_audio", False),
                    same_output_threshold=options.get("same_output_threshold", 10),
                )
                logging.info("Running OpenVINO backend.")
            except Exception as e:
                logging.error(f"OpenVINO not supported: {e}")
                self.backend = BackendType.FASTER_WHISPER
                self.client_uid = options["uid"]
                websocket.send(json.dumps({
                    "uid": self.client_uid,
                    "status": "WARNING",
                    "message": "OpenVINO not supported on Server yet. "
                                "Reverting to available backend: 'faster_whisper'"
                }))

        try:
            if self.backend.is_faster_whisper():
                from whisper_live.backend.faster_whisper_backend import ServeClientFasterWhisper
                # model is of the form namespace/repo_name and not a filesystem path
                if faster_whisper_custom_model_path is not None:
                    logging.info(f"Using custom model {faster_whisper_custom_model_path}")
                    options["model"] = faster_whisper_custom_model_path
                else:
                    # Default to base if no model specified
                    if "model" not in options or not options["model"]:
                        options["model"] = "base"
                        logging.info(f"Using default model: base")
                # Ensure language is None for auto-detection if not specified
                if "language" not in options or options["language"] is None or options["language"] == "":
                    options["language"] = None
                    logging.info("Language auto-detection enabled (language=None)")
                client = ServeClientFasterWhisper(
                    websocket,
                    language=options.get("language"),  # Use .get() to handle None gracefully
                    task=options.get("task", "transcribe"),
                    client_uid=options["uid"],
                    model=options["model"],
                    initial_prompt=options.get("initial_prompt"),
                    vad_parameters=options.get("vad_parameters"),
                    use_vad=self.use_vad,
                    single_model=self.single_model,
                    send_last_n_segments=options.get("send_last_n_segments", 10),
                    no_speech_thresh=options.get("no_speech_thresh", 0.45),
                    clip_audio=options.get("clip_audio", False),
                    same_output_threshold=options.get("same_output_threshold", 10),
                    cache_path=self.cache_path,
                    translation_queue=translation_queue
                )

                logging.info("Running faster_whisper backend.")
        except ConnectionClosed:
            # Backend closed the connection (e.g., model loading failed)
            logging.info("Connection closed during backend initialization")
            return False
        except Exception as e:
            import traceback
            error_type = type(e).__name__
            error_msg = str(e)
            logging.error(f"Failed to initialize faster_whisper backend: {error_type}: {error_msg}")
            logging.debug(f"Traceback: {traceback.format_exc()}")
            
            # Send error to client before returning (if websocket is still open)
            try:
                websocket.send(json.dumps({
                    "uid": options.get("uid", "unknown"),
                    "status": "ERROR",
                    "message": f"Failed to initialize backend: {error_msg}"
                }))
            except (ConnectionClosed, Exception) as send_error:
                # Websocket may already be closed by backend
                logging.debug(f"Could not send error message: {send_error}")
            return False

        if client is None:
            error_msg = f"Backend type {self.backend.value} not recognised or not handled."
            logging.error(error_msg)
            try:
                websocket.send(json.dumps({
                    "uid": options.get("uid", "unknown"),
                    "status": "ERROR",
                    "message": error_msg
                }))
            except:
                pass
            return False

        if translation_client:
            client.translation_client = translation_client
            client.translation_thread = translation_thread

        self.client_manager.add_client(websocket, client)
        return True

    def get_audio_from_websocket(self, websocket):
        """
        Receives audio buffer from websocket and creates a numpy array out of it.

        Args:
            websocket: The websocket to receive audio from.

        Returns:
            A numpy array containing the audio, False for END_OF_AUDIO, or None for non-audio data.
        """
        frame_data = websocket.recv()
        
        # Handle text messages (config, END_OF_AUDIO string)
        if isinstance(frame_data, str):
            if frame_data == "END_OF_AUDIO":
                return False
            # Skip other text messages (they should have been handled during handshake)
            logging.debug(f"⚠️ Received unexpected text message during audio streaming: {frame_data[:100]}")
            return None  # Return None to indicate non-audio data
        
        # Handle binary END_OF_AUDIO
        if frame_data == b"END_OF_AUDIO":
            return False
            
        # Convert binary audio data to numpy array
        try:
            return np.frombuffer(frame_data, dtype=np.float32)
        except Exception as e:
            logging.error(f"❌ Failed to convert audio data to numpy array: {e}")
            logging.error(f"   Data type: {type(frame_data)}, Length: {len(frame_data) if hasattr(frame_data, '__len__') else 'N/A'}")
            return None

    def handle_new_connection(self, websocket, faster_whisper_custom_model_path,
                              whisper_tensorrt_path, trt_multilingual, trt_py_session=False):
        try:
            logging.info("New client connected")
            options = websocket.recv()
            options = json.loads(options)
            logging.info(f"📋 Received client config: uid={options.get('uid', 'unknown')}, model={options.get('model', 'unknown')}")

            self.use_vad = options.get('use_vad')
            if self.client_manager.is_server_full(websocket, options):
                websocket.close()
                return False  # Indicates that the connection should not continue

            # Send immediate acknowledgment that we received the config
            try:
                websocket.send(json.dumps({
                    "uid": options.get("uid", "unknown"),
                    "status": "CONFIG_RECEIVED",
                    "message": "Processing your request..."
                }))
                logging.info("✅ Sent CONFIG_RECEIVED acknowledgment")
            except ConnectionClosed:
                logging.info(f"ℹ️  Client {options.get('uid', 'unknown')} disconnected before CONFIG_RECEIVED could be sent")
                return False
            except Exception as e:
                logging.warning(f"⚠️ Failed to send acknowledgment: {e}")

            if self.backend.is_tensorrt():
                self.vad_detector = VoiceActivityDetector(frame_rate=self.RATE)
            
            # Initialize client - return False if initialization fails
            if not self.initialize_client(websocket, options, faster_whisper_custom_model_path,
                                         whisper_tensorrt_path, trt_multilingual, trt_py_session=trt_py_session):
                logging.warning("Client initialization failed")
                return False
            
            return True
        except (InvalidUpgrade, InvalidMessage):
            # These are harmless - browsers/tools trying to connect incorrectly
            # The filter will suppress the log, but we handle it here too
            return False
        except json.JSONDecodeError:
            logging.error("Failed to decode JSON from client")
            return False
        except ConnectionClosed:
            logging.info("Connection closed by client")
            return False
        except Exception as e:
            # Only log if it's not a harmless handshake error
            if not any(phrase in str(e) for phrase in [
                'invalid Connection header',
                'did not receive a valid HTTP request',
                'connection closed while reading HTTP request'
            ]):
                logging.error(f"Error during new connection initialization: {str(e)}")
            return False

    def process_audio_frames(self, websocket):
        frame_np = self.get_audio_from_websocket(websocket)
        client = self.client_manager.get_client(websocket)
        
        # Check if client exists (was successfully initialized)
        if client is False or client is None:
            logging.warning("Client not found - connection may have failed during initialization")
            return False
        
        if frame_np is False:
            if self.backend.is_tensorrt() and client:
                client.set_eos(True)
            return False
        
        # Handle None (non-audio data like text messages)
        if frame_np is None:
            return True  # Continue processing, just skip this frame

        # Check for empty frames before processing (prevent AEC errors)
        if len(frame_np) == 0:
            logging.debug("⚠️ Received empty audio frame, skipping processing")
            return True  # Continue processing, just skip this frame

        # Ensure float32 dtype before processing (prevent float64 issues)
        if frame_np.dtype != np.float32:
            frame_np = frame_np.astype(np.float32)
        
        # Apply audio processing pipeline (hybrid AEC: browser + server)
        frame_np = self.audio_processor.process_audio_chunk(frame_np)
        
        # Ensure float32 after processing (VAD and transcription require float32)
        if frame_np.dtype != np.float32:
            frame_np = frame_np.astype(np.float32)
        
        # Check if processing resulted in empty array
        if len(frame_np) == 0:
            logging.debug("⚠️ Processed audio chunk is empty, skipping transcription")
            return True  # Continue processing, just skip this frame
        
        logging.debug(f"🎵 Audio processed chunk: {len(frame_np)} samples, dtype: {frame_np.dtype}")
        
        # DEBUG: Log audio processing for troubleshooting
        if len(frame_np) > 0:
            audio_level = np.abs(frame_np).mean()
            logging.debug(f"🔊 Audio level: {audio_level:.4f} (mean abs), max: {np.abs(frame_np).max():.4f}")

        if self.backend.is_tensorrt():
            voice_active = self.voice_activity(websocket, frame_np)
            if voice_active:
                self.no_voice_activity_chunks = 0
                if client:
                    client.set_eos(False)
            if self.use_vad and not voice_active:
                return True

        if client:
            client.add_frames(frame_np)
        return True

    def recv_audio(self,
                   websocket,   
                   backend: BackendType = BackendType.FASTER_WHISPER,
                   faster_whisper_custom_model_path=None,
                   whisper_tensorrt_path=None,
                   trt_multilingual=False,
                   trt_py_session=False):
        """
        Receive audio chunks from a client in an infinite loop.

        Continuously receives audio frames from a connected client
        over a WebSocket connection. It processes the audio frames using a
        voice activity detection (VAD) model to determine if they contain speech
        or not. If the audio frame contains speech, it is added to the client's
        audio data for ASR.
        If the maximum number of clients is reached, the method sends a
        "WAIT" status to the client, indicating that they should wait
        until a slot is available.
        If a client's connection exceeds the maximum allowed time, it will
        be disconnected, and the client's resources will be cleaned up.

        Args:
            websocket (WebSocket): The WebSocket connection for the client.
            backend (str): The backend to run the server with.
            faster_whisper_custom_model_path (str): path to custom faster whisper model.
            whisper_tensorrt_path (str): Required for tensorrt backend.
            trt_multilingual(bool): Only used for tensorrt, True if multilingual model.

        Raises:
            Exception: If there is an error during the audio frame processing.
        """
        self.backend = backend
        if not self.handle_new_connection(websocket, faster_whisper_custom_model_path,
                                          whisper_tensorrt_path, trt_multilingual, trt_py_session=trt_py_session):
            return

        try:
            while not self.client_manager.is_client_timeout(websocket):
                if not self.process_audio_frames(websocket):
                    break
        except (InvalidUpgrade, InvalidMessage):
            # Harmless handshake errors - already handled by filter
            pass
        except ConnectionClosed:
            logging.info("Connection closed by client")
        except Exception as e:
            # Only log if it's not a harmless handshake error
            error_str = str(e)
            error_type = type(e).__name__
            
            # Skip harmless errors
            if any(phrase in error_str for phrase in [
                'invalid Connection header',
                'did not receive a valid HTTP request',
                'connection closed while reading HTTP request',
                'stream ends after'
            ]):
                return
            
            # Log actual errors with full traceback for debugging
            import traceback
            logging.error(f"Unexpected error in recv_audio: {error_type}: {error_str}")
            logging.debug(f"Traceback: {traceback.format_exc()}")
        finally:
            if self.client_manager.get_client(websocket):
                self.cleanup(websocket)
                websocket.close()
            del websocket

    def run(self,
            host,
            port=9090,
            backend="tensorrt",
            faster_whisper_custom_model_path=None,
            whisper_tensorrt_path=None,
            trt_multilingual=False,
            trt_py_session=False,
            single_model=False,
            max_clients=4,
            max_connection_time=600,
            cache_path="~/.cache/whisper-live/"):
        """
        Run the transcription server.

        Args:
            host (str): The host address to bind the server.
            port (int): The port number to bind the server.
        """
        self.cache_path = cache_path
        self.client_manager = ClientManager(max_clients, max_connection_time)
        if faster_whisper_custom_model_path is not None and not os.path.exists(faster_whisper_custom_model_path):
            raise ValueError(f"Custom faster_whisper model '{faster_whisper_custom_model_path}' is not a valid path.")
        if whisper_tensorrt_path is not None and not os.path.exists(whisper_tensorrt_path):
            raise ValueError(f"TensorRT model '{whisper_tensorrt_path}' is not a valid path.")
        if single_model:
            if faster_whisper_custom_model_path or whisper_tensorrt_path:
                logging.info("Custom model option was provided. Switching to single model mode.")
                self.single_model = True
                # TODO: load model initially
            else:
                logging.info("Single model mode currently only works with custom models.")
        if not BackendType.is_valid(backend):
            raise ValueError(f"{backend} is not a valid backend type. Choose backend from {BackendType.valid_types()}")

        # Log AEC status
        if self.audio_processor and self.audio_processor.aec_processor:
            aec_stats = self.audio_processor.aec_processor.get_stats()
            logging.info("🎯 Hybrid AEC Status:")
            if aec_stats.get('enabled'):
                logging.info(f"   • AEC Type: {aec_stats.get('type', 'Unknown')}")
                logging.info(f"   • AEC Enabled: {aec_stats.get('aec_enabled', False)}")
                logging.info(f"   • Noise Suppression: {aec_stats.get('ns_enabled', False)}")
                logging.info(f"   • AGC: {aec_stats.get('agc_enabled', False)}")
                logging.info("   • Sample Rate: 16kHz, Channels: 1")
            else:
                logging.warning("   • AEC not enabled")
            logging.info("🔄 System uses: Browser AEC + Server AEC (hybrid approach)")
        else:
            logging.warning("⚠️ AEC not available - audio processing without echo cancellation")
            logging.warning("💡 Install webrtc-audio-processing for full AEC support")

        logging.info(f"🚀 Starting WhisperLive server on {host}:{port} with {backend} backend")

        with serve(
            functools.partial(
                self.recv_audio,
                backend=BackendType(backend),
                faster_whisper_custom_model_path=faster_whisper_custom_model_path,
                whisper_tensorrt_path=whisper_tensorrt_path,
                trt_multilingual=trt_multilingual,
                trt_py_session=trt_py_session,
            ),
            host,
            port
        ) as server:
            server.serve_forever()

    def voice_activity(self, websocket, frame_np):
        """
        Evaluates the voice activity in a given audio frame and manages the state of voice activity detection.

        This method uses the configured voice activity detection (VAD) model to assess whether the given audio frame
        contains speech. If the VAD model detects no voice activity for more than three consecutive frames,
        it sets an end-of-speech (EOS) flag for the associated client. This method aims to efficiently manage
        speech detection to improve subsequent processing steps.

        Args:
            websocket: The websocket associated with the current client. Used to retrieve the client object
                    from the client manager for state management.
            frame_np (numpy.ndarray): The audio frame to be analyzed. This should be a NumPy array containing
                                    the audio data for the current frame.

        Returns:
            bool: True if voice activity is detected in the current frame, False otherwise. When returning False
                after detecting no voice activity for more than three consecutive frames, it also triggers the
                end-of-speech (EOS) flag for the client.
        """
        # CRITICAL: Ensure float32 before VAD (ONNX model requires float32, not float64)
        if frame_np.dtype != np.float32:
            frame_np = frame_np.astype(np.float32)
        
        if not self.vad_detector(frame_np):
            self.no_voice_activity_chunks += 1
            if self.no_voice_activity_chunks > 3:
                client = self.client_manager.get_client(websocket)
                if not client.eos:
                    client.set_eos(True)
                time.sleep(0.1)    # Sleep 100m; wait some voice activity.
            return False
        return True

    def cleanup(self, websocket):
        """
        Cleans up resources associated with a given client's websocket.

        Args:
            websocket: The websocket associated with the client to be cleaned up.
        """
        client = self.client_manager.get_client(websocket)
        if client:
            if hasattr(client, 'translation_client') and client.translation_client:
                client.translation_client.cleanup()
                
            # Wait for translation thread to finish
            if hasattr(client, 'translation_thread') and client.translation_thread:
                client.translation_thread.join(timeout=2.0)
            self.client_manager.remove_client(websocket)

