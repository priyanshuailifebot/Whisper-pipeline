# Fixed: Tensor Dtype Error (float64 vs float32)

## 🔴 **The Problem**

You were seeing this error repeatedly in the WhisperLive server:

```
ERROR:root:[ERROR]: Failed to transcribe audio chunk: [ONNXRuntimeError] : 2 : INVALID_ARGUMENT : Unexpected input data type. Actual: (tensor(double)) , expected: (tensor(float))
```

### **Root Cause**

The VAD (Voice Activity Detection) model in `faster-whisper` expects audio data in **float32** format, but somewhere in the audio processing pipeline, the data was being converted to **float64** (double precision).

This happened because:
1. NumPy operations (especially with `scipy.signal`) can promote float32 to float64
2. Mathematical operations in Python can default to float64
3. The AEC processor and audio enhancement functions weren't explicitly maintaining float32 dtype

## ✅ **The Fix**

I've updated the following files to ensure **float32 is maintained throughout the entire audio processing pipeline**:

### **1. `/WhisperLive/whisper_live/server.py`**
- Added explicit float32 conversion before and after audio processing
- Added dtype logging for debugging

### **2. `/WhisperLive/whisper_live/preprocessing/audio_processor.py`**
- Updated `_normalize_audio()` to explicitly handle float64 → float32 conversion
- Updated `_enhance_audio()` to maintain float32 throughout all operations
- All numpy operations now explicitly cast to float32

### **3. `/WhisperLive/whisper_live/preprocessing/aec_processor.py`**
- Updated `process_audio()` to ensure input/output is float32
- Fixed `_apply_adaptive_aec()` to maintain float32
- Fixed `_apply_noise_suppression()` to maintain float32
- Fixed `_apply_agc()` to maintain float32
- Initialized all buffers and filters with float32 dtype

## 🎯 **What Changed**

### **Before:**
```python
# Could return float64
processed = signal.sosfilt(self.hp_sos, processed, zi=self.hp_zi)
return processed  # Might be float64!
```

### **After:**
```python
# Explicitly maintains float32
processed, self.hp_zi = signal.sosfilt(self.hp_sos, processed, zi=self.hp_zi)
processed = processed.astype(np.float32)  # ✅ Force float32
self.hp_zi = self.hp_zi.astype(np.float32)  # ✅ Force float32
return processed.astype(np.float32)  # ✅ Final check
```

## 📋 **About the WebRTC Errors (Non-Critical)**

The browser console errors about `/offer` endpoint are **NOT related to WhisperLive**:

```
POST http://localhost:3000/offer 404 (Not Found)
❌ WebRTC negotiation failed: Error: Server responded with 404: Not Found
```

These are from the **WebRTC Avatar service** (a separate service for video avatar). The error message even says:
```
⚠️ WebRTC Avatar Connection Failed: Endpoint not found: The /offer endpoint is not available on the server. Avatar service may not be running.
ℹ️ This is non-critical - WhisperLive transcription will still work
```

**These errors are harmless** - they just mean the avatar video service isn't running, but WhisperLive transcription works independently.

## 🚀 **Next Steps**

1. **Restart the WhisperLive server**:
   ```bash
   cd /Volumes/Projects/Whisper-pipeline
   source whisper_env/bin/activate
   cd WhisperLive
   python run_server.py --port 9090
   ```

2. **Test transcription**:
   - Open the frontend in your browser
   - Start speaking
   - Check the server logs - you should **NOT** see the `INVALID_ARGUMENT` errors anymore
   - Transcriptions should appear in the bottom control bar

3. **Verify**:
   - Server logs should show: `🎵 Audio processed chunk: [N] samples, dtype: float32`
   - No more `[ONNXRuntimeError]` errors
   - Transcriptions should work correctly

## 🔍 **How to Verify the Fix**

1. **Check server logs** - Look for:
   ```
   🎵 Audio processed chunk: 4096 samples, dtype: float32
   ```
   (Should show `dtype: float32`, not `dtype: float64`)

2. **No more errors** - The `INVALID_ARGUMENT` errors should be gone

3. **Transcriptions work** - You should see transcriptions appearing in the frontend

## 📝 **Technical Details**

The VAD model uses ONNX Runtime, which is strict about input types:
- **Expected**: `tensor(float)` = float32
- **Received**: `tensor(double)` = float64
- **Solution**: Explicit dtype conversion at every step

This is a common issue when mixing NumPy, SciPy, and machine learning libraries - they have different default dtypes, so explicit conversion is necessary.

