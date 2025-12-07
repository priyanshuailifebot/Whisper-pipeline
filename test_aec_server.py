#!/usr/bin/env python3
"""
Minimal test server for Hybrid AEC functionality
Demonstrates the AEC processing pipeline without full WhisperLive dependencies
"""

import asyncio
import websockets
import json
import numpy as np
import logging
from whisper_live.preprocessing.audio_processor import AudioProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestAECServer:
    """Minimal server to test AEC functionality"""

    def __init__(self):
        self.audio_processor = AudioProcessor(sample_rate=16000, enable_aec=True)
        self.connections = set()

    async def handle_connection(self, websocket, path):
        """Handle WebSocket connection"""
        logger.info("🎯 New client connected")
        self.connections.add(websocket)

        try:
            # Send server ready
            await websocket.send(json.dumps({
                "message": "SERVER_READY",
                "backend": "aec_test"
            }))

            # Wait for client configuration
            config_data = await websocket.recv()
            config = json.loads(config_data)
            logger.info(f"📋 Client config: {config}")

            # Send language detection (mock)
            await websocket.send(json.dumps({
                "language": "en",
                "language_prob": 0.95
            }))

            # Process audio chunks
            while True:
                try:
                    # Receive audio data (as binary)
                    audio_data = await websocket.recv()
                    if isinstance(audio_data, str):
                        if audio_data == "END_OF_AUDIO":
                            logger.info("🔚 End of audio received")
                            break
                        continue

                    # Convert binary audio to numpy array
                    audio_array = np.frombuffer(audio_data, dtype=np.float32)
                    logger.debug(f"🎵 Received audio chunk: {len(audio_array)} samples")

                    # Process through AEC pipeline
                    processed_audio = self.audio_processor.process_audio_chunk(audio_array)
                    logger.debug(f"🔇 Processed audio chunk: {len(processed_audio)} samples")

                    # Send mock transcription result
                    segments = [{
                        "text": f"Processed {len(processed_audio)} audio samples",
                        "start": 0.0,
                        "end": len(processed_audio) / 16000.0,
                        "completed": True
                    }]

                    await websocket.send(json.dumps({
                        "segments": segments
                    }))

                except websockets.exceptions.ConnectionClosed:
                    logger.info("🔌 Connection closed by client")
                    break
                except Exception as e:
                    logger.error(f"❌ Error processing audio: {e}")
                    break

        except Exception as e:
            logger.error(f"❌ Connection error: {e}")
        finally:
            self.connections.discard(websocket)

    async def run(self, host="0.0.0.0", port=9090):
        """Run the test server"""
        logger.info(f"🚀 Starting AEC Test Server on {host}:{port}")

        # Log AEC status
        aec_stats = self.audio_processor.get_stats()
        logger.info(f"🎯 AEC Status: {aec_stats}")

        server = await websockets.serve(self.handle_connection, host, port)
        logger.info("✅ AEC Test Server ready!")

        try:
            await server.wait_closed()
        except KeyboardInterrupt:
            logger.info("🛑 Server stopped by user")

def main():
    """Main function"""
    print("🎯 AEC Test Server")
    print("=================")
    print("This server demonstrates the hybrid AEC functionality.")
    print("It processes audio through the AEC pipeline and returns mock transcriptions.")
    print("")

    server = TestAECServer()

    try:
        asyncio.run(server.run())
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == "__main__":
    main()
