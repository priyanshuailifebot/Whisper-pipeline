# 🚀 Quick Start: Access Frontend & Verify WhisperLive Connection

## Step-by-Step Guide

### 1️⃣ Start WhisperLive Server

**Open Terminal 1:**
```bash
cd /Volumes/Projects/Whisper-pipeline
source whisper_env/bin/activate
cd WhisperLive
python run_server.py --backend faster_whisper --port 9090
```

**✅ Success Indicators:**
- You should see: `Server running on 0.0.0.0:9090`
- You should see: `🎯 Hybrid AEC enabled`
- No error messages

**⏸️ Keep this terminal open!**

---

### 2️⃣ Test Server Connection (Optional but Recommended)

**Open Terminal 2 (new terminal):**
```bash
cd /Volumes/Projects/Whisper-pipeline
source whisper_env/bin/activate
python3 test_whisperlive_connection.py
```

**✅ Expected Output:**
```
✅ WebSocket connection established!
✅ Server Response: {"message": "SERVER_READY", ...}
🎉 SUCCESS: Server is ready and accepting connections!
```

**If this fails**, the server isn't running correctly. Check Terminal 1 for errors.

---

### 3️⃣ Start Frontend

**In Terminal 2 (or new Terminal 3):**
```bash
cd /Volumes/Projects/Whisper-pipeline/Frontend
npm run dev
```

**✅ Success Indicators:**
- You should see: `Local: http://localhost:3000/`
- No error messages

**⏸️ Keep this terminal open too!**

---

### 4️⃣ Access Frontend in Browser

1. **Open your browser** (Chrome, Firefox, Safari, Edge)
2. **Navigate to**: `http://localhost:3000`
3. **Wait for the welcome screen** to load

---

### 5️⃣ Verify WhisperLive Connection

#### **Visual Check: Top-Right Corner**

Look at the **top-right corner** of the page. You'll see a connection status indicator:

- 🟢 **Green WiFi Icon** = ✅ **Connected** to WhisperLive
- 🟡 **Yellow WiFi Icon** = ⏳ **Connecting...**
- 🔴 **Red WiFi Off Icon** = ❌ **Disconnected**

#### **Browser Console Check (Most Reliable)**

1. **Press `F12`** (or `Cmd+Option+I` on Mac) to open Developer Tools
2. **Click the "Console" tab**
3. **Look for these messages:**

```
✅ WebSocket connected to WhisperLive
🚀 WhisperLive ready for audio streaming
🎯 Browser AEC + Server AEC enabled for optimal echo cancellation
```

**If you see these**, WhisperLive is connected and working! ✅

---

### 6️⃣ Test the System

#### **Enable Continuous Mode**

1. Look for the **conversation mode toggle** in the header
2. Switch to **"Continuous Conversation"** mode
3. The connection status should turn **green** 🟢

#### **Test Audio Streaming**

1. **Start speaking** - the microphone should activate
2. **Check console** - you should see:
   ```
   📤 Sent 1600 audio samples to server
   📝 WhisperLive transcript: [your spoken words]
   ```

3. **Check for transcription** - your words should appear in the interface

#### **Test AEC (Echo Cancellation)**

1. **Let the avatar speak** (it will respond to your input)
2. **While avatar is speaking**, start talking yourself
3. **Your voice should be captured clearly** without echo
4. **Check console** for: `🔇 AEC processed audio chunk`

---

## 🔍 Detailed Connection Status

### Connection Status Values

The connection status can be one of:

| Status | Icon | Meaning | Action |
|--------|------|---------|--------|
| `connected` | 🟢 Green | WhisperLive connected | ✅ Ready to use |
| `connecting` | 🟡 Yellow | Connecting to server | ⏳ Wait a moment |
| `disconnected` | 🔴 Red | Not connected | ❌ Check server |
| `error` | 🔴 Red | Connection error | ❌ Check logs |

### Where to See Status

1. **Top-Right Header**: Visual WiFi icon with color
2. **Browser Console**: Detailed connection logs
3. **Network Tab**: WebSocket connection status

---

## 🐛 Troubleshooting

### Problem: Status Shows "Disconnected" (Red)

**Check 1: Is server running?**
```bash
# In Terminal 1, you should see server logs
# If not, start the server
```

**Check 2: Is server accessible?**
```bash
# Run the test script
python3 test_whisperlive_connection.py
```

**Check 3: Check browser console for errors**
- Press F12 → Console tab
- Look for red error messages
- Common errors:
  - `WebSocket connection failed` → Server not running
  - `Connection refused` → Port 9090 blocked
  - `CORS error` → Check server configuration

**Solution:**
1. Verify WhisperLive server is running (Terminal 1)
2. Check if port 9090 is available: `lsof -i :9090`
3. Try restarting both server and frontend

---

### Problem: Status Shows "Connecting" (Yellow) Forever

**Possible Causes:**
- Server is slow to respond
- Network issues
- Server is full (max clients reached)

**Solution:**
1. Wait 10-15 seconds
2. Check server logs for errors
3. Refresh the browser page
4. Restart WhisperLive server

---

### Problem: No Audio Streaming

**Check 1: Microphone Permission**
```javascript
// In browser console (F12)
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Mic access granted'))
  .catch(err => console.error('❌ Mic error:', err))
```

**Check 2: Console Logs**
- Look for: `📤 Sent X audio samples to server`
- If missing, microphone isn't streaming

**Solution:**
1. Grant microphone permissions in browser
2. Check browser settings → Privacy → Microphone
3. Use HTTPS in production (required for mic access)

---

### Problem: No Transcription Received

**Check Server Logs:**
- Should see: `🎵 Audio processed chunk: X samples`
- Should see: `📝 Transcription segments sent`

**Check Frontend Console:**
- Should see: `📝 WhisperLive transcript: [text]`

**Solution:**
1. Verify faster-whisper model is downloaded
2. Check server has enough CPU/memory
3. Wait for first model load (can take 10-30 seconds)

---

## 📊 Monitoring Dashboard

### Real-Time Monitoring

**Browser Console Commands:**
```javascript
// Check connection status
window.checkMicStatus()

// Check if connected
console.log('Connected:', window.whisperLiveClient?.isConnected)

// Force reconnect
window.forceStartMic()

// Check audio streaming
console.log('Recording:', window.whisperLiveClient?.isRecording)
```

### Server-Side Monitoring

**Watch Terminal 1 (Server) for:**
- `✅ New client connected` - Frontend connected
- `🎵 Audio processed chunk` - Audio being processed
- `🔇 AEC processed audio chunk` - AEC working
- `📝 Transcription segments sent` - Transcriptions sent

---

## ✅ Success Checklist

Use this checklist to verify everything is working:

- [ ] WhisperLive server running (Terminal 1 shows "Server running")
- [ ] Frontend running (Terminal 2 shows "Local: http://localhost:3000")
- [ ] Browser opened to `http://localhost:3000`
- [ ] Connection status is **green** 🟢 in top-right
- [ ] Console shows "SERVER_READY" message
- [ ] Continuous mode enabled
- [ ] Microphone permission granted
- [ ] Audio chunks being sent (console logs)
- [ ] Transcriptions appearing in real-time
- [ ] No echo when avatar speaks

**If all checked ✅, your system is fully operational!**

---

## 🎯 Quick Test Commands

### Test Server Connection
```bash
cd /Volumes/Projects/Whisper-pipeline
source whisper_env/bin/activate
python3 test_whisperlive_connection.py
```

### Check Server Port
```bash
lsof -i :9090
# Should show Python process listening
```

### Check Frontend Port
```bash
lsof -i :3000
# Should show Node/Vite process
```

### Test WebSocket Manually
```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:9090
```

---

## 📞 Need Help?

1. **Check logs**: Both server and browser console
2. **Run test script**: `python3 test_whisperlive_connection.py`
3. **Verify ports**: 9090 (server) and 3000 (frontend)
4. **Check permissions**: Microphone access in browser
5. **Restart everything**: Server and frontend

---

**🎉 Once you see the green connection status and console shows "SERVER_READY", you're all set!**

