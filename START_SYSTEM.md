# 🚀 Starting the Hybrid AEC WhisperLive System

## Quick Start Guide

### Step 1: Start WhisperLive Server

**Terminal 1:**
```bash
cd /Volumes/Projects/Whisper-pipeline
source whisper_env/bin/activate
cd WhisperLive
python run_server.py --backend faster_whisper --port 9090
```

**Expected Output:**
```
INFO:whisper_live.server:🎯 Hybrid AEC enabled - complementing browser AEC with server-side processing
INFO:whisper_live.server:Running faster_whisper backend.
Server running on 0.0.0.0:9090
```

### Step 2: Start Frontend

**Terminal 2:**
```bash
cd /Volumes/Projects/Whisper-pipeline/Frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 3: Access Frontend

1. **Open Browser**: Navigate to `http://localhost:3000`
2. **Check Connection Status**: Look at the top-right corner for connection indicator
3. **Enable Continuous Mode**: Toggle to "Continuous Conversation" mode
4. **Start Speaking**: The system will automatically connect to WhisperLive

## 🔍 Verifying Connection

### Visual Indicators in Frontend

1. **Connection Status Badge** (Top-right):
   - 🟢 **Green**: Connected to WhisperLive
   - 🟡 **Yellow**: Connecting...
   - 🔴 **Red**: Disconnected

2. **Console Logs** (Press F12 → Console):
   ```
   ✅ WebSocket connected to WhisperLive
   🚀 WhisperLive ready for audio streaming
   🎯 Browser AEC + Server AEC enabled for optimal echo cancellation
   ```

3. **Audio Streaming**:
   - Microphone icon should show active
   - Transcripts should appear in real-time
   - No echo from avatar speech

### Browser Console Commands

Open Developer Tools (F12) and run:

```javascript
// Check WhisperLive client status
window.checkMicStatus()

// Check connection
console.log('Connection:', window.whisperLiveClient?.isConnected)

// Force reconnect
window.forceStartMic()
```

## 🧪 Testing the System

### Test 1: Basic Connection
1. Open frontend
2. Switch to continuous mode
3. Check console for "SERVER_READY" message
4. Connection status should be green

### Test 2: Audio Streaming
1. Start speaking
2. Check console for "Sent X audio samples to server"
3. Check for transcription responses
4. Verify no echo from avatar

### Test 3: AEC Functionality
1. Let avatar speak
2. While avatar is speaking, start talking
3. Your voice should be captured clearly
4. No echo or feedback in transcription

## 🐛 Troubleshooting

### Connection Issues

**Problem**: Connection status shows red
```bash
# Check if server is running
curl http://localhost:9090

# Check server logs for errors
# Look for "New client connected" messages
```

**Solution**:
1. Verify WhisperLive server is running on port 9090
2. Check firewall settings
3. Verify WebSocket URL in frontend: `ws://localhost:9090`

### Audio Not Streaming

**Problem**: No audio being sent
```javascript
// In browser console
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Mic access:', stream))
  .catch(err => console.error('Mic error:', err))
```

**Solution**:
1. Grant microphone permissions in browser
2. Check browser console for permission errors
3. Verify HTTPS in production (required for mic access)

### No Transcription

**Problem**: Audio sent but no transcription received
```bash
# Check server logs
# Should see: "Processing audio chunk: X samples"
```

**Solution**:
1. Verify faster-whisper model is downloaded
2. Check server logs for model loading errors
3. Ensure sufficient CPU/memory resources

## 📊 Monitoring

### Server Logs
Watch for these messages:
- `✅ New client connected`
- `🎵 Audio processed chunk: X samples`
- `🔇 AEC processed audio chunk`
- `📝 Transcription segments sent`

### Frontend Console
Watch for:
- `✅ WhisperLive client connected`
- `📤 Sent X audio samples to server`
- `📝 WhisperLive transcript: [your text]`
- `🎯 Browser AEC + Server AEC enabled`

## 🎯 Success Indicators

✅ **System is working correctly when:**
1. Connection status is green
2. Console shows "SERVER_READY"
3. Audio chunks are being sent (console logs)
4. Transcriptions appear in real-time
5. No echo when avatar speaks
6. Smooth continuous conversation flow

## 🔧 Advanced Debugging

### Test WebSocket Connection Directly
```bash
# Install wscat
npm install -g wscat

# Connect to server
wscat -c ws://localhost:9090

# Send test config
{"uid":"test","language":"en","task":"transcribe","model":"small"}
```

### Check Server Health
```python
# In Python (with venv activated)
python3 -c "
import websockets
import asyncio
import json

async def test():
    uri = 'ws://localhost:9090'
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            'uid': 'test',
            'language': 'en',
            'task': 'transcribe',
            'model': 'small'
        }))
        response = await ws.recv()
        print('Server response:', response)

asyncio.run(test())
"
```

## 📝 Environment Variables

Create `.env` file in Frontend directory:
```bash
REACT_APP_WHISPER_SERVER_URL=ws://localhost:9090
```

Or modify `vite.config.js` to set default URL.

