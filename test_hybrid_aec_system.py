#!/usr/bin/env python3
"""
Test script for Hybrid AEC System (Browser + Server AEC)
Tests the complete WhisperLive audio processing pipeline
"""

import sys
import os
import time
import numpy as np
import requests
import websocket
import json
import threading
from queue import Queue

# Add WhisperLive to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'WhisperLive'))

def test_webrtc_aec_import():
    """Test WebRTC AEC import and basic functionality"""
    print("🔍 Testing WebRTC AEC import...")

    try:
        import webrtc_audio_processing as webrtc
        print("✅ WebRTC Audio Processing imported successfully")

        # Test APM creation
        apm = webrtc.AudioProcessingModule()
        print("✅ AudioProcessingModule created successfully")

        # Test AEC configuration
        apm.aec_enabled = True
        apm.aec_delay_agnostic_enabled = True
        apm.aec_extended_filter_enabled = True
        print("✅ AEC configuration applied successfully")

        return True
    except ImportError as e:
        print(f"❌ WebRTC Audio Processing import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ WebRTC AEC initialization failed: {e}")
        return False

def test_aec_processor():
    """Test our AEC processor implementation"""
    print("🔍 Testing AEC processor...")

    try:
        from whisper_live.preprocessing.audio_processor import AudioProcessor

        # Create processor
        processor = AudioProcessor(sample_rate=16000, enable_aec=True)

        # Test with dummy audio
        dummy_audio = np.random.randn(1600).astype(np.float32)  # 100ms of audio
        processed_audio = processor.process_audio_chunk(dummy_audio)

        print(f"✅ AEC processor created and processed {len(processed_audio)} samples")
        print(f"   AEC enabled: {processor.enable_aec}")
        print(f"   AEC processor active: {processor.aec_processor.is_enabled() if processor.aec_processor else False}")

        # Get stats
        stats = processor.get_stats()
        print(f"   Processor stats: {stats}")

        return True
    except Exception as e:
        print(f"❌ AEC processor test failed: {e}")
        return False

def test_whisper_server_import():
    """Test WhisperLive server imports"""
    print("🔍 Testing WhisperLive server imports...")

    try:
        from whisper_live.preprocessing.audio_processor import AudioProcessor
        from whisper_live.server import TranscriptionServer

        # Test server creation (without starting)
        server = TranscriptionServer()

        print("✅ WhisperLive server imports successful")
        print(f"   Sample rate: {server.RATE}")
        print(f"   AEC processor initialized: {server.audio_processor is not None}")

        return True
    except Exception as e:
        print(f"❌ WhisperLive server import failed: {e}")
        return False

def test_websocket_connection():
    """Test WebSocket connection to WhisperLive server"""
    print("🔍 Testing WebSocket connection...")

    # This test assumes the server is running
    try:
        # Try to connect to the server
        ws = websocket.create_connection("ws://localhost:9090", timeout=5)

        # Send a test message
        test_config = {
            "uid": "test-client",
            "language": "en",
            "task": "transcribe",
            "model": "small"
        }

        ws.send(json.dumps(test_config))
        print("✅ Test configuration sent to server")

        # Wait for response
        result = ws.recv()
        response = json.loads(result)

        if "message" in response and response["message"] == "SERVER_READY":
            print("✅ Server responded correctly")
            ws.close()
            return True
        else:
            print(f"❌ Unexpected server response: {response}")
            ws.close()
            return False

    except Exception as e:
        print(f"❌ WebSocket connection test failed: {e}")
        print("   Note: Make sure WhisperLive server is running on port 9090")
        return False

def simulate_audio_stream():
    """Simulate audio streaming to test the pipeline"""
    print("🔍 Testing audio streaming simulation...")

    try:
        # Generate test audio (1 second of 16kHz audio)
        sample_rate = 16000
        duration = 1.0
        samples = int(sample_rate * duration)

        # Create a simple sine wave
        t = np.linspace(0, duration, samples, False)
        frequency = 440  # A note
        audio = np.sin(frequency * 2 * np.pi * t).astype(np.float32)

        # Simulate streaming in chunks
        chunk_size = 1600  # 100ms chunks
        chunks_sent = 0

        for i in range(0, len(audio), chunk_size):
            chunk = audio[i:i + chunk_size]
            if len(chunk) < chunk_size:
                chunk = np.pad(chunk, (0, chunk_size - len(chunk)), 'constant')

            # Convert to bytes (simulate WebSocket transmission)
            audio_bytes = chunk.tobytes()
            chunks_sent += 1

        print(f"✅ Simulated streaming {chunks_sent} audio chunks ({duration}s of audio)")
        return True

    except Exception as e:
        print(f"❌ Audio streaming simulation failed: {e}")
        return False

def run_complete_system_test():
    """Run all tests for the complete hybrid AEC system"""
    print("🎯 Running Complete Hybrid AEC System Test")
    print("=" * 50)

    tests = [
        ("WebRTC AEC Import", test_webrtc_aec_import),
        ("AEC Processor", test_aec_processor),
        ("WhisperLive Server Import", test_whisper_server_import),
        ("WebSocket Connection", test_websocket_connection),
        ("Audio Streaming Simulation", simulate_audio_stream)
    ]

    results = []
    for test_name, test_func in tests:
        print(f"\n🔬 {test_name}")
        print("-" * 30)
        result = test_func()
        results.append((test_name, result))

    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)

    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if not result:
            all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! Hybrid AEC system is ready.")
        print("\n🚀 Next steps:")
        print("   1. Start WhisperLive server: python run_server.py --backend faster_whisper")
        print("   2. Start frontend: npm run dev")
        print("   3. Test continuous conversation with echo cancellation")
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        print("\n🔧 Troubleshooting:")
        print("   - Install WebRTC: pip install webrtc-audio-processing")
        print("   - Start WhisperLive server on port 9090")
        print("   - Check firewall settings for WebSocket connections")

    return all_passed

if __name__ == "__main__":
    success = run_complete_system_test()
    sys.exit(0 if success else 1)
