# WhisperLive Connection Status Guide

## How to Check if WhisperLive is Connected

### 1. **Visual Indicator in Header**
   - Look at the top-right of the page header
   - You'll see two status badges:
     - **"WhisperLive Ready"** (Green) = ✅ Connected and ready for transcription
     - **"Connecting WhisperLive..."** (Yellow) = ⏳ Connecting to server
     - **"WhisperLive Disconnected"** (Gray) = ❌ Not connected (server may be down)
     - **"WhisperLive Error"** (Red) = ⚠️ Connection error

### 2. **Browser Console**
   Open browser console (F12 or Cmd+Option+I) and look for:
   
   **✅ Connected:**
   ```
   ✅ WebSocket connected to WhisperLive
   ✅ WhisperLive client connected
   ✅ WhisperLive client active - streaming audio with hybrid AEC
   🚀 WhisperLive ready for audio streaming
   ```
   
   **❌ Not Connected:**
   ```
   ⚠️ WhisperLive client connection failed (non-critical)
   ⚠️ WebSocket connection timeout
   ```

### 3. **Test Transcription**
   Once you see **"WhisperLive Ready"** in the header:
   1. Start speaking into your microphone
   2. Check the console for transcript messages:
      ```
      📝 WhisperLive transcript: [your spoken text]
      ```
   3. Your speech should appear in the conversation interface

## Status States Explained

| Status | Color | Meaning | Action |
|--------|-------|---------|--------|
| **WhisperLive Ready** | 🟢 Green | Connected and ready | ✅ Start speaking |
| **Connecting WhisperLive...** | 🟡 Yellow | Connecting to server | ⏳ Wait a few seconds |
| **WhisperLive Disconnected** | ⚪ Gray | Server not available | 🔧 Start WhisperLive server |
| **WhisperLive Error** | 🔴 Red | Connection error | 🔍 Check server logs |

## Troubleshooting

### If Status Shows "Disconnected":

1. **Check if WhisperLive server is running:**
   ```bash
   cd WhisperLive
   python run_server.py --backend faster_whisper --port 9090
   ```

2. **Check server logs for errors:**
   - Look for "✅ SERVER_READY sent to client"
   - Check for any error messages

3. **Verify WebSocket connection:**
   - Open browser console
   - Look for WebSocket connection messages
   - Check Network tab for WebSocket connection

### If Status Shows "Error":

1. **Check browser console for specific error:**
   - Look for error messages starting with "❌"
   - Common errors:
     - `Connection timeout` - Server not responding
     - `WebSocket connection failed` - Server not running
     - `NotAllowedError` - Microphone permission denied

2. **Check microphone permissions:**
   - Browser should prompt for microphone access
   - Allow microphone access when prompted

### Testing Connection

**Quick Test in Browser Console:**
```javascript
// Check WhisperLive client status
window.checkMicStatus()

// Force restart WhisperLive client
window.forceStartMic()

// Check connection
console.log('WhisperLive Status:', document.querySelector('[title*="WhisperLive"]')?.textContent)
```

## Expected Flow

1. **App Starts** → WhisperLive status: "Disconnected"
2. **Welcome Screen** → Status remains "Disconnected" (not started yet)
3. **App Started** → Status changes to "Connecting WhisperLive..."
4. **Server Connected** → Status changes to "WhisperLive Ready" ✅
5. **Start Speaking** → Transcripts appear in console and UI

## Notes

- **Avatar Connection** (separate badge) is for the video avatar - not required for transcription
- **WhisperLive** is the transcription service - this is what you need for live transcription
- If WhisperLive is disconnected, the app will still work, but transcription won't function
- The connection is automatic - no manual action needed once the app starts

