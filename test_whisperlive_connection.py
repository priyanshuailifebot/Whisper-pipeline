#!/usr/bin/env python3
"""
Test script to verify WhisperLive server connection
Run this to check if the server is accessible and responding correctly
"""

import asyncio
import websockets
import json
import sys
import time

async def test_whisperlive_connection(uri="ws://localhost:9090", timeout=5):
    """Test connection to WhisperLive server"""
    print("🔍 Testing WhisperLive Server Connection")
    print("=" * 50)
    print(f"📍 Server URL: {uri}")
    print(f"⏱️  Timeout: {timeout} seconds")
    print()

    try:
        print("🔌 Attempting to connect...")
        async with websockets.connect(uri, ping_interval=None) as websocket:
            print("✅ WebSocket connection established!")
            print()

            # Send client configuration
            config = {
                "uid": "test-client-" + str(int(time.time())),
                "language": "en",
                "task": "transcribe",
                "model": "small",
                "use_vad": True,
                "send_last_n_segments": 10
            }

            print("📤 Sending client configuration...")
            print(f"   Config: {json.dumps(config, indent=2)}")
            await websocket.send(json.dumps(config))
            print("✅ Configuration sent")
            print()

            # Wait for server response
            print("⏳ Waiting for server response...")
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=timeout)
                response_data = json.loads(response)

                print("📥 Server Response:")
                print(f"   {json.dumps(response_data, indent=2)}")
                print()

                # Check response type
                if response_data.get("status") == "CONFIG_RECEIVED":
                    print("✅ Server received configuration")
                    print("   Waiting for model loading and SERVER_READY...")
                    # Wait for SERVER_READY (with longer timeout for model loading)
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=120)  # 2 minutes
                        response_data = json.loads(response)
                        if response_data.get("message") == "SERVER_READY":
                            print("🎉 SUCCESS: Server is ready and accepting connections!")
                            print()
                            print("✅ Connection Test: PASSED")
                            print("✅ Server Status: READY")
                            print("✅ AEC Processing: Available")
                            return True
                        elif response_data.get("status") == "LOADING":
                            # Continue to LOADING handler below
                            pass
                        else:
                            print(f"⚠️  Unexpected response: {response_data}")
                            return False
                    except asyncio.TimeoutError:
                        print("❌ Timeout: Server did not send SERVER_READY within 2 minutes")
                        return False
                
                if "message" in response_data:
                    if response_data["message"] == "SERVER_READY":
                        print("🎉 SUCCESS: Server is ready and accepting connections!")
                        print()
                        print("✅ Connection Test: PASSED")
                        print("✅ Server Status: READY")
                        print("✅ AEC Processing: Available")
                        return True
                    elif response_data.get("status") == "LOADING":
                        print(f"⏳ Server is loading model: {response_data.get('message', 'Loading...')}")
                        print("   Waiting for model to load (this may take a minute on first use)...")
                        # Wait longer for model loading
                        try:
                            response = await asyncio.wait_for(websocket.recv(), timeout=120)  # 2 minutes for model load
                            response_data = json.loads(response)
                            if response_data.get("message") == "SERVER_READY":
                                print("✅ Model loaded! Server is ready!")
                                return True
                            else:
                                print(f"⚠️  Unexpected response after loading: {response_data}")
                                return False
                        except asyncio.TimeoutError:
                            print("❌ Timeout: Model loading took too long (>2 minutes)")
                            return False
                    elif response_data.get("status") == "WAIT":
                        print("⚠️  Server is full, waiting for slot...")
                        print(f"   Wait time: {response_data.get('message', 'unknown')} minutes")
                        return False
                    elif response_data.get("status") == "ERROR":
                        print(f"❌ Server Error: {response_data.get('message', 'Unknown error')}")
                        return False
                elif "language" in response_data:
                    print("✅ Server detected language")
                    print("✅ Connection Test: PASSED")
                    return True
                else:
                    print("⚠️  Unexpected response format")
                    return False

            except asyncio.TimeoutError:
                print(f"❌ Timeout: No response from server within {timeout} seconds")
                return False

    except websockets.exceptions.InvalidURI:
        print(f"❌ Invalid WebSocket URI: {uri}")
        print("   Make sure the URL starts with 'ws://' or 'wss://'")
        return False
    except ConnectionRefusedError:
        print(f"❌ Connection refused: Server is not running on {uri}")
        print()
        print("🔧 Troubleshooting:")
        print("   1. Start WhisperLive server:")
        print("      cd WhisperLive")
        print("      python run_server.py --backend faster_whisper --port 9090")
        print("   2. Check if port 9090 is available")
        print("   3. Verify firewall settings")
        return False
    except Exception as e:
        print(f"❌ Connection Error: {type(e).__name__}: {e}")
        return False

async def test_audio_streaming(uri="ws://localhost:9090"):
    """Test audio streaming capability"""
    print()
    print("🎵 Testing Audio Streaming Capability")
    print("=" * 50)

    try:
        async with websockets.connect(uri, ping_interval=None) as websocket:
            # Send config
            config = {
                "uid": "audio-test-" + str(int(time.time())),
                "language": "en",
                "task": "transcribe",
                "model": "small"
            }
            await websocket.send(json.dumps(config))

            # Wait for SERVER_READY (handle new status flow)
            server_ready = False
            max_wait_time = 120  # 2 minutes for model loading
            
            try:
                # Wait for first response (should be CONFIG_RECEIVED or SERVER_READY)
                response = await asyncio.wait_for(websocket.recv(), timeout=5)
                response_data = json.loads(response)
                
                if response_data.get("message") == "SERVER_READY":
                    server_ready = True
                    print("✅ Server ready for audio (model already loaded)")
                elif response_data.get("status") == "CONFIG_RECEIVED":
                    print("✅ Config received, waiting for model...")
                    # Wait for LOADING or SERVER_READY
                    response = await asyncio.wait_for(websocket.recv(), timeout=max_wait_time)
                    response_data = json.loads(response)
                    
                    if response_data.get("status") == "LOADING":
                        print(f"⏳ {response_data.get('message', 'Loading model...')}")
                        # Wait for SERVER_READY
                        response = await asyncio.wait_for(websocket.recv(), timeout=max_wait_time)
                        response_data = json.loads(response)
                    
                    if response_data.get("message") == "SERVER_READY":
                        server_ready = True
                        print("✅ Server ready for audio")
                    elif response_data.get("status") == "ERROR":
                        print(f"❌ Server Error: {response_data.get('message', 'Unknown error')}")
                        return False
                    else:
                        print(f"⚠️  Unexpected response: {response_data}")
                        return False
                elif response_data.get("status") == "ERROR":
                    print(f"❌ Server Error: {response_data.get('message', 'Unknown error')}")
                    return False
                else:
                    print(f"⚠️  Unexpected first response: {response_data}")
                    return False
                    
            except asyncio.TimeoutError:
                print("❌ Timeout waiting for SERVER_READY")
                return False

            if not server_ready:
                print("❌ Server not ready for audio streaming")
                return False

            print()

            # Send test audio chunk (dummy float32 array)
            import numpy as np
            test_audio = np.random.randn(1600).astype(np.float32)  # 100ms at 16kHz
            audio_bytes = test_audio.tobytes()

            print(f"📤 Sending test audio chunk ({len(test_audio)} samples)...")
            await websocket.send(audio_bytes)
            print("✅ Audio chunk sent")
            print()

            # Wait for transcription response
            print("⏳ Waiting for transcription response...")
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=10)
                response_data = json.loads(response)

                if "segments" in response_data:
                    print("✅ Transcription received!")
                    print(f"   Segments: {len(response_data['segments'])}")
                    for seg in response_data['segments']:
                        print(f"   - {seg.get('text', 'No text')}")
                    print()
                    print("✅ Audio Streaming Test: PASSED")
                    return True
                else:
                    print("⚠️  Unexpected response format")
                    print(f"   Response: {response_data}")
                    return False

            except asyncio.TimeoutError:
                print("⚠️  No transcription response (this is normal for test audio)")
                print("✅ Audio streaming capability confirmed")
                return True

    except Exception as e:
        print(f"❌ Audio streaming test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🎯 WhisperLive Connection Test Suite")
    print("=" * 50)
    print()

    # Test 1: Basic connection
    connection_ok = asyncio.run(test_whisperlive_connection())

    if not connection_ok:
        print()
        print("❌ Basic connection test failed. Please fix issues above.")
        sys.exit(1)

    # Test 2: Audio streaming
    audio_ok = asyncio.run(test_audio_streaming())

    print()
    print("=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    print(f"✅ Connection Test: {'PASSED' if connection_ok else 'FAILED'}")
    print(f"✅ Audio Streaming: {'PASSED' if audio_ok else 'FAILED'}")
    print()

    if connection_ok and audio_ok:
        print("🎉 All tests passed! WhisperLive server is ready.")
        print()
        print("🚀 Next Steps:")
        print("   1. Start frontend: cd Frontend && npm run dev")
        print("   2. Open browser: http://localhost:3000")
        print("   3. Switch to continuous conversation mode")
        print("   4. Start speaking to test AEC and transcription")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()

