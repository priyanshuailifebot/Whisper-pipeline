#!/usr/bin/env python3
import websocket
import json
import time
import uuid

def test_connection():
    ws_url = "ws://localhost:9090"
    uid = str(uuid.uuid4())
    
    print(f"Connecting to {ws_url}...")
    ws = websocket.create_connection(ws_url, timeout=5)
    print("✅ Connected")
    
    # Send config
    config = {
        "uid": uid,
        "model": "large-v3",
        "language": "en",
        "use_vad": True
    }
    print(f"Sending config: {config}")
    ws.send(json.dumps(config))
    print("✅ Config sent")
    
    # Wait for responses
    print("Waiting for server messages...")
    start = time.time()
    while time.time() - start < 60:  # Wait up to 60 seconds
        try:
            ws.settimeout(1)
            msg = ws.recv()
            print(f"📨 Received: {msg[:200]}...")
            data = json.loads(msg)
            if data.get("message") == "SERVER_READY":
                print("✅✅✅ SERVER_READY received!")
                break
        except websocket._exceptions.WebSocketTimeoutException:
            print(".", end="", flush=True)
        except Exception as e:
            print(f"\n❌ Error: {e}")
            break
    
    ws.close()
    print("\nDone")

if __name__ == "__main__":
    test_connection()

