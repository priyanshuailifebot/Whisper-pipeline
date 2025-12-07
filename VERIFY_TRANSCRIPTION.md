# How to Verify Transcription is Working

## 🔍 **Debugging Steps**

### **1. Check Browser Console**

After speaking, look for these messages in the browser console:

#### **Expected Messages:**
```
📨 Received message from server: {hasSegments: true, ...}
✅ Received transcription segments: X segments
📝 Full transcription: [your spoken text]
📤 Calling onTranscript callback with: {...}
```

#### **If you see:**
- `📨 Received message from server` but no segments → Server is sending messages but not transcriptions
- No messages at all → WebSocket connection issue
- `⚠️ No segments in transcription message` → Server sent empty transcription

### **2. Check WhisperLive Server Terminal**

Look for these log messages:

#### **Expected Messages:**
```
🎵 Audio processed chunk: 4096 samples, dtype: float32
🔊 Audio level: 0.XXXX (mean abs), max: 0.XXXX
📤 Sending transcription to client [uid]: X segments, text: '[your text]...'
✅ Successfully sent X segments to client [uid]
```

#### **If you see:**
- `🎵 Audio processed chunk` → Audio is being received and processed ✅
- `🔊 Audio level` → Audio has signal (should be > 0.01 for speech)
- `📤 Sending transcription` → Transcription is being generated and sent ✅
- No `📤 Sending transcription` → Transcription not being generated (check below)

### **3. Verify Audio is Being Received**

#### **Check Audio Level:**
- If `audio_level` is very low (< 0.001), your microphone might not be picking up audio
- If `audio_level` is 0.0, no audio is being received
- Normal speech should be between 0.01 and 0.5

#### **Check VAD (Voice Activity Detection):**
- If VAD is enabled, it filters out non-speech audio
- Look for: `voice_active = True` in logs
- If `voice_active = False`, VAD is filtering out your audio

### **4. Common Issues and Solutions**

#### **Issue: No transcription messages in browser console**
**Possible causes:**
1. **Server not generating transcriptions**
   - Check server logs for `📤 Sending transcription`
   - If missing, check for errors in transcription process

2. **WebSocket connection issue**
   - Check browser console for WebSocket errors
   - Verify server is running on port 9090
   - Check network tab for WebSocket connection

3. **Audio not being sent**
   - Check browser console for: `📋 Sent client configuration to server`
   - Check for: `▶️ Audio recording started`
   - Verify microphone permission is granted

#### **Issue: Audio processed but no transcription**
**Possible causes:**
1. **VAD filtering out audio**
   - Check if `voice_active = False` in server logs
   - Try speaking louder or closer to microphone
   - Check VAD threshold settings

2. **Model not loaded**
   - Check server startup logs for: `✅ Model loaded`
   - If missing, model loading failed

3. **Transcription errors**
   - Check server logs for transcription errors
   - Look for `[ERROR]: Failed to transcribe audio chunk`

#### **Issue: Transcription appears in server logs but not in browser**
**Possible causes:**
1. **Message format mismatch**
   - Check browser console for: `⚠️ Unhandled message type`
   - Verify message has `segments` field

2. **onTranscript callback not working**
   - Check browser console for: `📤 Calling onTranscript callback`
   - Verify `handleVoiceInput` is being called in App.jsx

## 🧪 **Quick Test Script**

Add this to your browser console to test the connection:

```javascript
// Check if WhisperLive client exists
if (window.whisperLiveClient) {
  console.log('✅ WhisperLive client exists');
  console.log('Connection status:', window.whisperLiveClient.isConnected);
} else {
  console.log('❌ WhisperLive client not found');
}

// Monitor WebSocket messages
const originalLog = console.log;
console.log = function(...args) {
  if (args[0]?.includes?.('transcription') || args[0]?.includes?.('segment')) {
    originalLog('🔍 TRANSCRIPTION DEBUG:', ...args);
  }
  originalLog.apply(console, args);
};
```

## 📊 **Expected Flow**

1. **Connection:**
   ```
   Browser → WebSocket connect → Server
   Server → SERVER_READY → Browser
   ```

2. **Audio Streaming:**
   ```
   Browser → Audio chunks (float32) → Server
   Server → Process audio → VAD → Transcription
   ```

3. **Transcription:**
   ```
   Server → {segments: [...]} → Browser
   Browser → handleTranscriptionMessage → onTranscript → handleVoiceInput → UI
   ```

## ✅ **Verification Checklist**

- [ ] Server logs show: `🎵 Audio processed chunk`
- [ ] Server logs show: `🔊 Audio level: > 0.01`
- [ ] Server logs show: `📤 Sending transcription`
- [ ] Browser console shows: `📨 Received message from server`
- [ ] Browser console shows: `✅ Received transcription segments`
- [ ] Browser console shows: `📝 Full transcription: [text]`
- [ ] Transcript appears in bottom control bar

## 🐛 **If Still Not Working**

1. **Enable verbose logging:**
   - Server: Already enabled with DEBUG logs
   - Browser: Check console for all messages

2. **Test with a simple message:**
   - Speak clearly: "Hello, this is a test"
   - Wait 2-3 seconds
   - Check both server and browser logs

3. **Check network tab:**
   - Open browser DevTools → Network tab
   - Filter by WS (WebSocket)
   - Check for messages being sent/received

4. **Verify microphone:**
   - Check system microphone settings
   - Test microphone in another app
   - Verify browser has microphone permission

---

**After adding the debug logging, restart both server and frontend, then speak and check the logs!**

