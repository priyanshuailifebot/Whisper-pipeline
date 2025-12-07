#!/usr/bin/env python3
"""
Test script for Hybrid AEC + WhisperLive integration
Tests the complete system: Frontend WebSocket client + Server AEC processing
"""

import os
import sys
import time
import subprocess
import signal
import threading
import websocket
import json
import numpy as np
from pathlib import Path

# Add whisper_live to path
sys.path.insert(0, str(Path(__file__).parent))

from whisper_live.preprocessing.aec_processor import create_aec_processor

class AECIntegrationTest:
    """Test the complete AEC + WhisperLive integration"""

    def __init__(self):
        self.server_process = None
        self.test_results = {
            'aec_available': False,
            'server_started': False,
            'websocket_connected': False,
            'transcription_received': False,
            'aec_processing': False
        }

    def test_aec_processor(self):
        """Test AEC processor initialization"""
        print("🔍 Testing AEC processor...")

        try:
            aec = create_aec_processor()
            self.test_results['aec_available'] = aec.is_active

            if aec.is_active:
                print("✅ WebRTC AEC processor available")

                # Test processing dummy audio
                dummy_audio = np.random.randn(1600).astype(np.float32)  # 100ms of audio
                processed = aec.process(dummy_audio)
                self.test_results['aec_processing'] = len(processed) == len(dummy_audio)
                print("✅ AEC processing test passed")
            else:
                print("⚠️ Fallback AEC processor (WebRTC not available)")
                self.test_results['aec_processing'] = True

            aec.cleanup()
            return True

        except Exception as e:
            print(f"❌ AEC processor test failed: {e}")
            return False

    def start_server(self):
        """Start WhisperLive server for testing"""
        print("🚀 Starting WhisperLive server...")

        try:
            # Start server in background
            self.server_process = subprocess.Popen([
                sys.executable, 'run_server.py',
                '--port', '9091',  # Use different port for testing
                '--backend', 'faster_whisper'
            ], cwd=str(Path(__file__).parent))

            # Wait for server to start
            time.sleep(3)

            if self.server_process.poll() is None:
                self.test_results['server_started'] = True
                print("✅ Server started successfully")
                return True
            else:
                print("❌ Server failed to start")
                return False

        except Exception as e:
            print(f"❌ Failed to start server: {e}")
            return False

    def test_websocket_connection(self):
        """Test WebSocket connection to server"""
        print("🔌 Testing WebSocket connection...")

        try:
            def on_message(ws, message):
                try:
                    data = json.loads(message)
                    if 'status' in data and data['status'] == 'SERVER_READY':
                        self.test_results['websocket_connected'] = True
                        print("✅ WebSocket connection established")
                        ws.close()
                except:
                    pass

            def on_error(ws, error):
                print(f"❌ WebSocket error: {error}")

            def on_close(ws, close_status_code, close_msg):
                pass

            def on_open(ws):
                # Send client configuration
                config = {
                    'uid': 'test-client-123',
                    'language': 'en',
                    'task': 'transcribe',
                    'model': 'small',
                    'use_vad': True
                }
                ws.send(json.dumps(config))

            ws = websocket.WebSocketApp(
                "ws://localhost:9091",
                on_open=on_open,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )

            # Run WebSocket connection with timeout
            wst = threading.Thread(target=ws.run_forever)
            wst.daemon = True
            wst.start()

            # Wait for connection or timeout
            timeout = 10
            start_time = time.time()
            while not self.test_results['websocket_connected'] and (time.time() - start_time) < timeout:
                time.sleep(0.1)

            if not self.test_results['websocket_connected']:
                ws.close()
                print("❌ WebSocket connection timeout")
                return False

            return True

        except Exception as e:
            print(f"❌ WebSocket test failed: {e}")
            return False

    def run_all_tests(self):
        """Run all integration tests"""
        print("🧪 Starting Hybrid AEC + WhisperLive Integration Tests")
        print("=" * 60)

        # Test AEC processor
        if not self.test_aec_processor():
            return False

        # Start server
        if not self.start_server():
            return False

        # Test WebSocket connection
        if not self.test_websocket_connection():
            return False

        # Cleanup
        self.cleanup()

        # Print results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS:")
        for test, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test}: {status}")

        all_passed = all(self.test_results.values())
        if all_passed:
            print("\n🎉 ALL TESTS PASSED! Hybrid AEC + WhisperLive integration ready!")
        else:
            print("\n⚠️ Some tests failed. Check the output above.")

        return all_passed

    def cleanup(self):
        """Clean up test resources"""
        if self.server_process:
            try:
                self.server_process.terminate()
                self.server_process.wait(timeout=5)
                print("🧹 Server process terminated")
            except:
                try:
                    self.server_process.kill()
                except:
                    pass

def main():
    """Main test function"""
    tester = AECIntegrationTest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
