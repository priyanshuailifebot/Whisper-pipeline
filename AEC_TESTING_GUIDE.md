# AEC (Acoustic Echo Cancellation) Testing Guide

## 🔍 Current AEC Status

**AEC is currently DISABLED** in `run_server.py`:
```python
os.environ['WHISPER_LIVE_AEC_ENABLED'] = 'false'
```

This was done to test if AEC was causing transcription issues. However, **AEC should be ENABLED** for best results when the avatar is speaking.

## ✅ How to Check AEC Status

### Method 1: Run Test Script
```bash
cd /Volumes/Projects/Whisper-pipeline
source whisper_env/bin/activate
python test_aec_status.py
```

**Expected Output:**
```
📋 Environment Variable: WHISPER_LIVE_AEC_ENABLED = false
   ⚠️  AEC is DISABLED via environment variable

✅ AEC Processor created successfully
✅ AEC is FUNCTIONAL
📋 Type: WebRTC-Style AEC
```

### Method 2: Check Server Logs
When the server starts, look for:

**AEC Enabled:**
```
🎯 Hybrid AEC enabled - complementing browser AEC with server-side processing
🎯 Hybrid AEC Status:
   • AEC Type: WebRTC-Style AEC
   • AEC Enabled: True
```

**AEC Disabled:**
```
🔇 Server AEC disabled via WHISPER_LIVE_AEC_ENABLED=false - using browser AEC only
```

**AEC Failed:**
```
⚠️ Server AEC not available - relying on browser AEC only
```

## 🧪 How to Test AEC Effectiveness

### Test 1: Echo Cancellation Test

**Setup:**
1. Start server with AEC **ENABLED**
2. Open frontend in browser
3. Enable continuous conversation mode

**Test Steps:**
1. **Let avatar speak** (ask a question, wait for response)
2. **While avatar is speaking**, start talking into microphone
3. **Check transcriptions** - should only contain YOUR voice, not avatar's

**Expected Result:**
- ✅ **Good AEC**: Transcriptions only show your words, not avatar's speech
- ❌ **Bad AEC**: Transcriptions include avatar's words mixed with yours

**Example:**
```
Avatar says: "Hi, how can I help you today?"
You say: "Tell me about Nasscom"

Good AEC transcription: "Tell me about Nasscom" ✅
Bad AEC transcription: "Hi how can I help you today tell me about Nasscom" ❌
```

### Test 2: Audio Quality Test

**Setup:**
1. Start server with AEC **ENABLED** and **DISABLED** (two separate tests)
2. Speak the same phrase in both scenarios
3. Compare transcription accuracy

**Test Steps:**
1. **With AEC enabled**: Say "My name is [your name]. What is your name?"
2. **With AEC disabled**: Say the same phrase
3. Compare which transcription is more accurate

**Expected Result:**
- If transcriptions are **more accurate with AEC disabled**: AEC might be filtering too much
- If transcriptions are **more accurate with AEC enabled**: AEC is helping

### Test 3: Background Noise Test

**Setup:**
1. Play music or have background noise
2. Speak into microphone
3. Check if transcriptions are affected

**Expected Result:**
- ✅ **Good AEC**: Background noise filtered, clear transcriptions
- ❌ **Bad AEC**: Background noise affects transcriptions

## 🔧 How to Enable/Disable AEC

### Enable AEC:
**File**: `WhisperLive/run_server.py`
```python
# Change this line:
os.environ['WHISPER_LIVE_AEC_ENABLED'] = 'false'
# To:
os.environ['WHISPER_LIVE_AEC_ENABLED'] = 'true'
# Or remove the line entirely (defaults to True)
```

### Disable AEC:
**File**: `WhisperLive/run_server.py`
```python
os.environ['WHISPER_LIVE_AEC_ENABLED'] = 'false'
```

**After changing**, restart the server:
```bash
# Stop server (Ctrl+C)
cd /Volumes/Projects/Whisper-pipeline/WhisperLive
source ../whisper_env/bin/activate
python run_server.py --backend faster_whisper --port 9090
```

## 🎯 AEC Configuration Options

### Current Setup:
- **Browser AEC**: Always enabled (`echoCancellation: true` in audio constraints)
- **Server AEC**: Controlled by `WHISPER_LIVE_AEC_ENABLED` environment variable
- **Hybrid Approach**: Browser AEC + Server AEC (when enabled)

### AEC Types:
1. **WebRTC-Style AEC** (preferred): Enhanced DSP with adaptive filtering
2. **Fallback AEC**: Basic DSP-based echo cancellation
3. **Dummy AEC**: No processing (when all else fails)

## 📊 AEC Diagnostics

### Check AEC Stats in Server Logs:
When a client connects, the server logs AEC status:
```
🎯 Hybrid AEC Status:
   • AEC Type: WebRTC-Style AEC
   • AEC Enabled: True
   • Noise Suppression: True
   • AGC: False
   • Sample Rate: 16kHz, Channels: 1
```

### Browser Console:
Check for audio processing logs:
```javascript
🎤 Audio streaming: chunk 100, level: 0.0024, avg: 0.0024, gain: 2x
```

## 🐛 Troubleshooting Wrong Transcriptions

### If transcriptions are wrong with AEC enabled:

1. **Test with AEC disabled**:
   ```python
   # In run_server.py
   os.environ['WHISPER_LIVE_AEC_ENABLED'] = 'false'
   ```
   - If transcriptions improve → AEC is filtering too much
   - If transcriptions stay wrong → Problem is elsewhere

2. **Check audio levels**:
   - Browser console should show: `level: 0.0024` or higher
   - If `level: 0.0000` → Microphone issue, not AEC

3. **Test with different phrases**:
   - Simple: "Hello, my name is [name]"
   - Complex: "Tell me about artificial intelligence and machine learning"
   - See if accuracy varies

4. **Check for echo**:
   - Use headphones to prevent speaker→mic feedback
   - Test in quiet environment
   - Speak clearly and at normal volume

## 📝 Recommended Settings

### For Best Transcription Accuracy:
```python
# run_server.py
os.environ['WHISPER_LIVE_AEC_ENABLED'] = 'true'  # Enable AEC
```

### For Testing/Debugging:
```python
# run_server.py
os.environ['WHISPER_LIVE_AEC_ENABLED'] = 'false'  # Disable AEC
```

### For Quiet Environments (no echo):
- AEC can be disabled (browser AEC is usually sufficient)
- May improve transcription accuracy if AEC is too aggressive

### For Noisy Environments (with echo):
- AEC should be enabled
- Helps filter out speaker audio and background noise

## 🎯 Quick Test Checklist

- [ ] Run `python test_aec_status.py` to check AEC status
- [ ] Check server logs for AEC initialization messages
- [ ] Test with AEC enabled: Speak while avatar is talking
- [ ] Test with AEC disabled: Compare transcription accuracy
- [ ] Check browser console for audio levels
- [ ] Verify microphone is working in other apps
- [ ] Test in quiet vs noisy environment

---

**Status**: AEC is currently DISABLED for testing
**Recommendation**: Enable AEC for production use, test both modes to find what works best

