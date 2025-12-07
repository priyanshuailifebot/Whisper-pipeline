#!/usr/bin/env python3
"""
Test the complete Hybrid AEC system with WebRTC-style processing
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'WhisperLive'))

import asyncio
import websockets
import json
import numpy as np
import logging
from whisper_live.preprocessing.audio_processor import AudioProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AECDemoServer:
    """Demo server to showcase WebRTC-style AEC processing"""

    def __init__(self):
        self.audio_processor = AudioProcessor(sample_rate=16000, enable_aec=True)
        self.connections = set()
        self.processing_stats = {
            'total_chunks': 0,
            'total_samples': 0,
            'avg_processing_time': 0
        }

    async def handle_connection(self, websocket, path):
        """Handle WebSocket connection and demonstrate AEC"""
        logger.info("🎯 AEC Demo client connected")
        self.connections.add(websocket)

        try:
            # Send server ready
            await websocket.send(json.dumps({
                "message": "SERVER_READY",
                "aec_info": "WebRTC-Style Hybrid AEC Active"
            }))

            # Wait for client config
            config_data = await websocket.recv()
            config = json.loads(config_data)
            logger.info(f"📋 Client config: {config}")

            # Send language detection
            await websocket.send(json.dumps({
                "language": "en",
                "language_prob": 0.95
            }))

            # Process audio chunks and demonstrate AEC
            while True:
                try:
                    # Receive audio data
                    audio_data = await websocket.recv()
                    if isinstance(audio_data, str):
                        if audio_data == "END_OF_AUDIO":
                            break
                        continue

                    # Convert to numpy array
                    audio_array = np.frombuffer(audio_data, dtype=np.float32)
                    self.processing_stats['total_chunks'] += 1
                    self.processing_stats['total_samples'] += len(audio_array)

                    logger.debug(f"🎵 Received audio chunk: {len(audio_array)} samples")

                    # Process through WebRTC-style AEC
                    import time
                    start_time = time.time()
                    processed_audio = self.audio_processor.process_audio_chunk(audio_array)
                    processing_time = time.time() - start_time

                    # Update stats
                    self.processing_stats['avg_processing_time'] = (
                        (self.processing_stats['avg_processing_time'] *
                         (self.processing_stats['total_chunks'] - 1) + processing_time) /
                        self.processing_stats['total_chunks']
                    )

                    # Calculate audio metrics
                    input_rms = np.sqrt(np.mean(audio_array**2))
                    output_rms = np.sqrt(np.mean(processed_audio**2))

                    logger.info(f"🔇 AEC processed: {len(processed_audio)} samples "
                              f"(RMS: {input_rms:.3f} → {output_rms:.3f}) "
                              f"Time: {processing_time:.3f}s")

                    # Send mock transcription with AEC stats
                    segments = [{
                        "text": f"AEC processed {len(processed_audio)} samples - "
                               f"RMS: {input_rms:.3f}→{output_rms:.3f}",
                        "start": 0.0,
                        "end": len(processed_audio) / 16000.0,
                        "completed": True
                    }]

                    await websocket.send(json.dumps({
                        "segments": segments,
                        "aec_stats": {
                            "chunks_processed": self.processing_stats['total_chunks'],
                            "avg_processing_time": self.processing_stats['avg_processing_time'],
                            "aec_type": self.audio_processor.aec_processor.get_stats()['type']
                        }
                    }))

                except websockets.exceptions.ConnectionClosed:
                    logger.info("🔌 AEC Demo client disconnected")
                    break
                except Exception as e:
                    logger.error(f"❌ AEC Demo processing error: {e}")
                    break

        except Exception as e:
            logger.error(f"❌ AEC Demo connection error: {e}")
        finally:
            self.connections.discard(websocket)

    async def run(self, host="localhost", port=9090):
        """Run the AEC demo server"""
        logger.info("🚀 Starting AEC Demo Server with WebRTC-Style Processing")
        logger.info(f"📍 Server: {host}:{port}")

        # Show AEC configuration
        aec_stats = self.audio_processor.get_stats()
        logger.info("🎯 AEC Configuration:")
        for key, value in aec_stats.items():
            logger.info(f"   {key}: {value}")

        server = await websockets.serve(self.handle_connection, host, port)

        logger.info("✅ AEC Demo Server ready!")
        logger.info("🎤 Send audio data to test WebRTC-style AEC processing")
        logger.info("📊 Server will show RMS changes and processing stats")

        try:
            await server.wait_closed()
        except KeyboardInterrupt:
            logger.info("🛑 AEC Demo Server stopped")

def main():
    """Main function"""
    print("🎯 WebRTC-Style AEC Demo Server")
    print("=" * 40)
    print("This server demonstrates the full WebRTC-style AEC implementation.")
    print("It processes audio through:")
    print("  • High-pass filtering")
    print("  • Adaptive echo cancellation")
    print("  • Noise suppression")
    print("  • Automatic gain control")
    print("")
    print("Connect from frontend to see AEC in action!")

    server = AECDemoServer()

    try:
        asyncio.run(server.run())
    except KeyboardInterrupt:
        print("\n👋 AEC Demo Server stopped")

if __name__ == "__main__":
    main()
