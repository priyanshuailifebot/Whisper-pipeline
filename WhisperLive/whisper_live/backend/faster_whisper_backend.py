import os
import json
import logging
import threading
import time
import torch
import ctranslate2
from huggingface_hub import snapshot_download
from websockets.exceptions import ConnectionClosed

from whisper_live.transcriber.transcriber_faster_whisper import WhisperModel
from whisper_live.backend.base import ServeClientBase


class ServeClientFasterWhisper(ServeClientBase):
    SINGLE_MODEL = None
    SINGLE_MODEL_LOCK = threading.Lock()

    def __init__(
        self,
        websocket,
        task="transcribe",
        device=None,
        language=None,
        client_uid=None,
            model="base",
        initial_prompt=None,
        vad_parameters=None,
        use_vad=True,
        single_model=False,
        send_last_n_segments=10,
        no_speech_thresh=0.45,
        clip_audio=False,
        same_output_threshold=7,
        cache_path="~/.cache/whisper-live/",
        translation_queue=None,
    ):
        """
        Initialize a ServeClient instance.
        The Whisper model is initialized based on the client's language and device availability.
        The transcription thread is started upon initialization. A "SERVER_READY" message is sent
        to the client to indicate that the server is ready.

        Args:
            websocket (WebSocket): The WebSocket connection for the client.
            task (str, optional): The task type, e.g., "transcribe". Defaults to "transcribe".
            device (str, optional): The device type for Whisper, "cuda" or "cpu". Defaults to None.
            language (str, optional): The language for transcription. Defaults to None.
            client_uid (str, optional): A unique identifier for the client. Defaults to None.
            model (str, optional): The whisper model size. Defaults to 'small.en'
            initial_prompt (str, optional): Prompt for whisper inference. Defaults to None.
            single_model (bool, optional): Whether to instantiate a new model for each client connection. Defaults to False.
            send_last_n_segments (int, optional): Number of most recent segments to send to the client. Defaults to 10.
            no_speech_thresh (float, optional): Segments with no speech probability above this threshold will be discarded. Defaults to 0.45.
            clip_audio (bool, optional): Whether to clip audio with no valid segments. Defaults to False.
            same_output_threshold (int, optional): Number of repeated outputs before considering it as a valid segment. Defaults to 10.

        """
        super().__init__(
            client_uid,
            websocket,
            send_last_n_segments,
            no_speech_thresh,
            clip_audio,
            same_output_threshold,
            translation_queue
        )
        self.cache_path = cache_path
        self.model_sizes = [
            "tiny", "tiny.en", "base", "base.en", "small", "small.en",
            "medium", "medium.en", "large-v2", "large-v3", "distil-small.en",
            "distil-medium.en", "distil-large-v2", "distil-large-v3",
            "large-v3-turbo", "turbo"
        ]

        self.model_size_or_path = model
        # Auto-detect language: if language is None or empty, let the model detect it
        # Don't force "en" based on model name - let the model auto-detect
        self.language = language  # None = auto-detect, otherwise use specified language
        self.task = task
        
        # Log language configuration
        if self.language is None:
            logging.info(f"🌍 Language auto-detection enabled for client {client_uid} (will detect from audio)")
        else:
            logging.info(f"🌍 Using specified language '{self.language}' for client {client_uid}")
        self.initial_prompt = initial_prompt
        # VadOptions valid parameters: threshold, neg_threshold, min_speech_duration_ms, 
        # max_speech_duration_s, min_silence_duration_ms, speech_pad_ms
        # Note: 'onset' is no longer supported in newer faster-whisper versions
        self.vad_parameters = vad_parameters or {}  # Use empty dict to let faster-whisper use defaults

        device = "cuda" if torch.cuda.is_available() else "cpu"
        if device == "cuda":
            major, _ = torch.cuda.get_device_capability(device)
            self.compute_type = "float16" if major >= 7 else "float32"
        else:
            self.compute_type = "int8"

        if self.model_size_or_path is None:
            logging.error("Model not specified - cannot initialize faster_whisper backend")
            try:
                self.websocket.send(json.dumps({
                    "uid": self.client_uid,
                    "status": "ERROR",
                    "message": "Model not specified. Please provide a valid model name."
                }))
            except ConnectionClosed:
                logging.info(f"ℹ️  Client {self.client_uid} disconnected before error message could be sent")
            except Exception as e:
                logging.warning(f"⚠️  Failed to send error message: {e}")
            return
        
        logging.info(f"Using Device={device} with precision {self.compute_type}")
        
        # Send loading status immediately to prevent client timeout
        try:
            self.websocket.send(json.dumps({
                "uid": self.client_uid,
                "status": "LOADING",
                "message": f"Loading model '{self.model_size_or_path}'... This may take a minute on first use."
            }))
            logging.info(f"📤 Sent LOADING status to client {self.client_uid}")
        except ConnectionClosed:
            logging.info(f"ℹ️  Client {self.client_uid} disconnected before LOADING status could be sent")
        except Exception as e:
            logging.warning(f"⚠️  Failed to send LOADING status: {e}")
    
        try:
            if single_model:
                if ServeClientFasterWhisper.SINGLE_MODEL is None:
                    logging.info(f"🔄 Loading model '{self.model_size_or_path}' (first time, may take a while)...")
                    self.create_model(device)
                    ServeClientFasterWhisper.SINGLE_MODEL = self.transcriber
                    logging.info("✅ Model loaded and cached")
                else:
                    self.transcriber = ServeClientFasterWhisper.SINGLE_MODEL
                    logging.info("✅ Using cached model")
            else:
                logging.info(f"🔄 Loading model '{self.model_size_or_path}'...")
                self.create_model(device)
                logging.info("✅ Model loaded")
        except Exception as e:
            import traceback
            logging.error(f"Failed to load model: {e}")
            logging.debug(f"Traceback: {traceback.format_exc()}")
            try:
                self.websocket.send(json.dumps({
                    "uid": self.client_uid,
                    "status": "ERROR",
                    "message": f"Failed to load model '{str(self.model_size_or_path)}': {str(e)}"
                }))
            except ConnectionClosed:
                logging.info(f"ℹ️  Client {self.client_uid} disconnected before error message could be sent")
            except Exception as send_error:
                logging.warning(f"⚠️  Failed to send error message (websocket may be closed): {send_error}")
            return

        self.use_vad = use_vad

        # threading
        self.trans_thread = threading.Thread(target=self.speech_to_text)
        self.trans_thread.start()
        
        # Send SERVER_READY message
        try:
            self.websocket.send(
                json.dumps(
                    {
                        "uid": self.client_uid,
                        "message": self.SERVER_READY,
                        "backend": "faster_whisper"
                    }
                )
            )
            logging.info(f"✅ SERVER_READY sent to client {self.client_uid}")
        except ConnectionClosed:
            # Client disconnected before we could send SERVER_READY - this is normal
            logging.info(f"ℹ️  Client {self.client_uid} disconnected before SERVER_READY could be sent (normal if client timed out)")
        except Exception as e:
            # Other errors - log as warning since connection might still be valid
            logging.warning(f"⚠️  Failed to send SERVER_READY to client {self.client_uid}: {e}")
            # Don't return - let the connection continue, client might retry

    def create_model(self, device):
        """
        Instantiates a new model, sets it as the transcriber. If model is a huggingface model_id
        then it is automatically converted to ctranslate2(faster_whisper) format.
        """
        import sys
        print(f"🔧 create_model() called with device='{device}'", file=sys.stderr, flush=True)
        print(f"   model_size_or_path: {self.model_size_or_path}", file=sys.stderr, flush=True)
        print(f"   compute_type: {self.compute_type}", file=sys.stderr, flush=True)
        logging.info(f"🔧 create_model() called with device='{device}'")
        logging.info(f"   model_size_or_path: {self.model_size_or_path}")
        logging.info(f"   compute_type: {self.compute_type}")
        
        model_ref = self.model_size_or_path

        if model_ref in self.model_sizes:
            # Model is a standard size - use the download_root to find/download it
            model_to_load = model_ref
            print(f"✅ Standard model size detected: {model_ref}", file=sys.stderr, flush=True)
            # Set download_root so WhisperModel knows where to cache
            download_root = os.path.expanduser(os.path.join(self.cache_path, "whisper-ct2-models/"))
            os.makedirs(download_root, exist_ok=True)
        else:
            logging.info(f"Model not in model_sizes")
            if os.path.isdir(model_ref) and ctranslate2.contains_model(model_ref):
                model_to_load = model_ref
            else:
                local_snapshot = snapshot_download(
                    repo_id = model_ref,
                    repo_type = "model",
                )
                logging.info(f"Checking if model at '{local_snapshot}' is already in CT2 format...")
                if ctranslate2.contains_model(local_snapshot):
                    logging.info(f"✅ Model is already in CT2 format, using directly: {local_snapshot}")
                    model_to_load = local_snapshot
                else:
                    logging.info(f"Model needs conversion to CT2 format")
                    cache_root = os.path.expanduser(os.path.join(self.cache_path, "whisper-ct2-models/"))
                    os.makedirs(cache_root, exist_ok=True)
                    safe_name = model_ref.replace("/", "--")
                    ct2_dir = os.path.join(cache_root, safe_name)
                    
                    logging.info(f"Checking if CT2 model exists at: {ct2_dir}")
                    if not ctranslate2.contains_model(ct2_dir):
                        logging.info(f"⏳ Converting '{model_ref}' to CTranslate2 @ {ct2_dir} (this may take several minutes)...")
                        try:
                            ct2_converter = ctranslate2.converters.TransformersConverter(
                                local_snapshot, 
                                copy_files=["tokenizer.json", "preprocessor_config.json"]
                            )
                            ct2_converter.convert(
                                output_dir=ct2_dir,
                                quantization=self.compute_type,
                                force=False,  # skip if already up-to-date
                            )
                            logging.info(f"✅ Conversion complete: {ct2_dir}")
                        except Exception as conv_error:
                            logging.error(f"❌ Conversion failed: {conv_error}")
                            raise
                    else:
                        logging.info(f"✅ CT2 model already exists at: {ct2_dir}")
                    model_to_load = ct2_dir

        import sys
        print(f"📦 Final model_to_load: {model_to_load}", file=sys.stderr, flush=True)
        print(f"🔄 About to instantiate WhisperModel...", file=sys.stderr, flush=True)
        logging.info(f"📦 Final model_to_load: {model_to_load}")
        logging.info(f"🔄 Instantiating WhisperModel with device='{device}', compute_type='{self.compute_type}'...")
        
        # For standard model sizes, specify download_root
        if model_ref in self.model_sizes:
            print(f"🌐 Using download_root for standard model", file=sys.stderr, flush=True)
            self.transcriber = WhisperModel(
                model_to_load,
                device=device,
                compute_type=self.compute_type,
                download_root=os.path.expanduser(os.path.join(self.cache_path, "whisper-ct2-models/")),
                local_files_only=False,
            )
        else:
            # For custom paths or HF models, don't specify download_root
            self.transcriber = WhisperModel(
                model_to_load,
                device=device,
                compute_type=self.compute_type,
                local_files_only=False,
            )
        
        print(f"✅ WhisperModel created successfully!", file=sys.stderr, flush=True)
        logging.info(f"✅ WhisperModel created successfully!")

    def set_language(self, info):
        """
        Updates the language attribute based on the detected language information.

        Args:
            info (object): An object containing the detected language and its probability. This object
                        must have at least two attributes: `language`, a string indicating the detected
                        language, and `language_probability`, a float representing the confidence level
                        of the language detection.
        """
        if info.language_probability > 0.5:
            self.language = info.language
            logging.info(f"Detected language {self.language} with probability {info.language_probability}")
            self.websocket.send(json.dumps(
                {"uid": self.client_uid, "language": self.language, "language_prob": info.language_probability}))

    def transcribe_audio(self, input_sample):
        """
        Transcribes the provided audio sample using the configured transcriber instance.

        If the language has not been set, it updates the session's language based on the transcription
        information.

        Args:
            input_sample (np.array): The audio chunk to be transcribed. This should be a NumPy
                                    array representing the audio data.

        Returns:
            The transcription result from the transcriber. The exact format of this result
            depends on the implementation of the `transcriber.transcribe` method but typically
            includes the transcribed text.
        """
        if ServeClientFasterWhisper.SINGLE_MODEL:
            ServeClientFasterWhisper.SINGLE_MODEL_LOCK.acquire()
        
        # Log language setting for debugging
        if self.language is None:
            logging.debug(f"🌍 Auto-detecting language for client {self.client_uid} (language=None)")
        else:
            logging.debug(f"🌍 Using specified language '{self.language}' for client {self.client_uid}")
        
        result, info = self.transcriber.transcribe(
            input_sample,
            initial_prompt=self.initial_prompt,
            language=self.language,  # None = auto-detect, otherwise use specified language
            task=self.task,
            vad_filter=self.use_vad,
            vad_parameters=self.vad_parameters if self.use_vad else None)
        if ServeClientFasterWhisper.SINGLE_MODEL:
            ServeClientFasterWhisper.SINGLE_MODEL_LOCK.release()

        # Auto-detect language if not set (first transcription)
        if self.language is None and info is not None:
            self.set_language(info)
        return result

    def handle_transcription_output(self, result, duration):
        """
        Handle the transcription output, updating the transcript and sending data to the client.

        Args:
            result (str): The result from whisper inference i.e. the list of segments.
            duration (float): Duration of the transcribed audio chunk.
        """
        # DEBUG: Log transcription result
        result_list = list(result) if result else []
        logging.info(f"🎯 Transcription result for client {self.client_uid}: {len(result_list)} segments from {duration:.2f}s audio")
        if len(result_list) > 0:
            for i, seg in enumerate(result_list):
                logging.info(f"  Segment {i+1}: '{seg.text}' (start: {getattr(seg, 'start', 0):.2f}s, end: {getattr(seg, 'end', 0):.2f}s, no_speech_prob: {getattr(seg, 'no_speech_prob', 0):.2f})")
        else:
            logging.warning(f"⚠️ No transcription segments returned (audio duration: {duration:.2f}s)")
        
        segments = []
        if len(result_list):
            self.t_start = None
            last_segment = self.update_segments(result_list, duration)
            segments = self.prepare_segments(last_segment)
            logging.info(f"📋 Prepared {len(segments)} segments to send to client")
        else:
            logging.info(f"ℹ️ No segments to process (empty result)")

        if len(segments):
            logging.info(f"📤 Sending {len(segments)} segments to client {self.client_uid}")
            self.send_transcription_to_client(segments)
        else:
            logging.info(f"⏭️ No segments to send (empty segments list)")
