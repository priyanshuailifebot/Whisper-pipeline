# Transcription Repetition Fix

## Problem Identified

You reported that transcriptions are being sent repeatedly back-to-back for the same audio. Analysis of the logs shows:

### Issues Found:

1. **Repetitive Transcriptions**: The server sends the same transcription multiple times
   - Example: "My name is Prinshu. What is your name?" appears 10+ times in the conversation history
   
2. **Missing Transcriptions**: Server logs show:
   ```
   WARNING:root:⚠️ No transcription segments returned (audio duration: 0.51s)
   WARNING:root:⚠️ No transcription segments returned (audio duration: 27.90s)
   ```
   - Whisper is NOT generating transcriptions for most audio chunks

3. **AEC May Be Filtering Audio**: The logs show very low audio levels:
   ```
   🎤 Audio streaming: chunk 300, level: 0.0000, avg: 0.0000, max: 0.0001
   ⚠️ Audio level is very low - microphone may not be capturing audio properly
   ```

## Root Causes

### Cause 1: `send_last_n_segments = 10` (Repetition)
- The client configuration sends the last 10 segments with every transcription
- This means if Whisper generates 1 new segment, it still sends the previous 9 segments again
- **Result**: The same transcription appears multiple times in the conversation

### Cause 2: AEC Processing (Silence)
- The Acoustic Echo Cancellation (AEC) processor may be too aggressive
- AEC's high-pass filter and compression might be removing valid speech
- **Result**: Audio chunks become silent, Whisper returns no transcriptions

### Cause 3: VAD + no_speech_thresh (Partial Cause)
- While we increased `no_speech_thresh` from 0.45 to 0.6, this only helps slightly
- VAD is still filtering out chunks that AEC has already degraded

## Fixes Applied

### Fix 1: Reduce `send_last_n_segments` from 10 to 1
**File**: `Frontend/src/utils/whisperLiveClient.js`

```javascript
// OLD
send_last_n_segments: options.sendLastNSegments || 10,

// NEW
send_last_n_segments: options.sendLastNSegments || 1,  // Reduced to prevent repetition
```

**Effect**: Only sends the current/latest segment, not the last 10 segments
**Result**: Eliminates repetitive transcriptions

### Fix 2: Temporarily Disable AEC
**File**: `WhisperLive/run_server.py`

```python
# OLD
os.environ.setdefault('WHISPER_LIVE_AEC_ENABLED', 'true')

# NEW
os.environ['WHISPER_LIVE_AEC_ENABLED'] = 'false'  # Temporarily disabled for testing
```

**Effect**: Disables server-side AEC processing
**Result**: Audio passes through unfiltered, allowing Whisper to transcribe

**Note**: Browser-side AEC is still active via `echoCancellation: true` in the audio constraints

## Testing the Fix

### Step 1: Restart Server
```bash
cd /Volumes/Projects/Whisper-pipeline/WhisperLive
source ../whisper_env/bin/activate
# Stop current server with Ctrl+C
python run_server.py --backend faster_whisper --port 9090
```

### Step 2: Refresh Frontend
- Hard refresh the browser page (Cmd+Shift+R on Mac, Ctrl+Shift+F5 on Windows)
- Or restart the frontend dev server

### Step 3: Test Transcription
1. Start speaking
2. Check that transcriptions appear **once** (not repeatedly)
3. Check server logs for successful transcriptions:
   ```
   🎯 Transcription result for client ...: X segments
   ✅ Added completed segment to transcript: '[text]'
   📤 Sending X segments to client
   ```

### What to Look For

**✅ Success Indicators:**
- Each spoken phrase appears only ONCE in the conversation
- Server logs show regular transcriptions (not "No transcription segments returned")
- Audio levels in browser console are reasonable (> 0.001)

**❌ Failure Indicators:**
- Still seeing repeated transcriptions → Need to check frontend deduplication
- Still seeing "No transcription segments returned" → AEC wasn't the only issue
- Audio levels still very low → Microphone issue

## If Issues Persist

### If Repetition Continues:
The frontend has deduplication logic that might need adjustment:

```javascript
// In whisperLiveClient.js, line 490
if (this.processedTranscripts.has(transcriptHash) && timeSinceLastProcess < 2000) {
  console.log('⏭️ Skipping duplicate transcript');
  return;
}
```

You could increase the deduplication window from 2000ms to 5000ms.

### If Transcriptions Still Missing:
1. **Check Microphone Input**: 
   - Test with another recording app (QuickTime, Audacity)
   - Ensure microphone is selected correctly in browser
   
2. **Disable VAD**:
   ```javascript
   // In whisperLiveClient.js
   use_vad: false,  // Disable Voice Activity Detection
   ```

3. **Lower no_speech_thresh Further**:
   ```javascript
   no_speech_thresh: 0.7,  // Even less aggressive
   ```

## Re-enabling AEC (After Testing)

Once transcriptions work without AEC, you can re-enable it with a gentler configuration:

**File**: `WhisperLive/run_server.py`
```python
os.environ['WHISPER_LIVE_AEC_ENABLED'] = 'true'
```

**File**: `WhisperLive/whisper_live/preprocessing/audio_processor.py`
```python
# Line 128-134: Reduce high-pass filter strength
filtered[i] = (0.98 * filtered[i-1] + 0.02 * audio[i])  # Was 0.95/0.05
```

## Summary of Changes

| Issue | Solution | File | Line |
|-------|----------|------|------|
| Repetitive transcriptions | `send_last_n_segments: 1` | `whisperLiveClient.js` | 51 |
| Silence from AEC | Disable AEC temporarily | `run_server.py` | 5 |
| Aggressive filtering | `no_speech_thresh: 0.6` | `whisperLiveClient.js` | 52 |
| Better logging | Enhanced debug logs | `base.py`, `faster_whisper_backend.py` | Various |

## Next Steps

1. **Test without AEC** - Verify transcriptions work and aren't repetitive
2. **If successful** - Consider re-enabling AEC with gentler settings
3. **If still failing** - Disable VAD or lower no_speech_thresh further

---

**Status**: ✅ FIXES APPLIED - READY TO TEST
**Priority**: Test without AEC first, then optimize

