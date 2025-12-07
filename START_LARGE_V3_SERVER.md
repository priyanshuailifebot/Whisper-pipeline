# Starting WhisperLive Server with Large-V3 Model

## 🚀 **Command to Start Server**

```bash
cd /Volumes/Projects/Whisper-pipeline
source whisper_env/bin/activate
cd WhisperLive
python run_server.py --backend faster_whisper --port 9090
```

## ⏱️ **Expected Timeline**

### **First Time (Model Download):**
- **Download time**: 5-15 minutes (depending on internet speed)
  - Model size: ~3GB for `large-v3`
  - Location: `~/.cache/whisper-live/whisper-ct2-models/`
- **Conversion time**: 2-5 minutes (if needed)
  - Converts to CTranslate2 format
- **Loading time**: 30-60 seconds
  - Loads model into memory
- **Total first time**: ~10-20 minutes

### **Subsequent Starts (Model Cached):**
- **Loading time**: 30-60 seconds
- **No download needed** (model already cached)

## 📊 **What to Look For in Server Logs**

### **1. Server Starting:**
```
INFO:root:New client connected
INFO:root:📋 Received client config: uid=..., model=large-v3
```

### **2. Model Download (First Time Only):**
```
INFO:root:🔄 Loading model 'large-v3' (first time, may take a while)...
INFO:root:Converting 'large-v3' to CTranslate2 @ ...
INFO:root:Loading model: ...
```

### **3. Model Loading:**
```
INFO:root:Using Device=cpu with precision int8
INFO:root:📤 Sent LOADING status to client ...
INFO:root:Loading model: ...
```

### **4. Model Ready:**
```
INFO:root:✅ Model loaded and cached
INFO:root:✅ SERVER_READY sent to client ...
INFO:root:Running faster_whisper backend.
```

### **5. Language Auto-Detection:**
```
INFO:root:🌍 Language auto-detection enabled for client ... (will detect from audio)
```

## ✅ **Server is Ready When You See:**

1. ✅ `✅ Model loaded and cached` or `✅ Model loaded`
2. ✅ `✅ SERVER_READY sent to client`
3. ✅ `Running faster_whisper backend.`
4. ✅ Server is listening (no errors)

## 🔍 **Check Model Cache Location**

The model will be cached at:
```
~/.cache/whisper-live/whisper-ct2-models/large-v3/
```

To check if model is already downloaded:
```bash
ls -lh ~/.cache/whisper-live/whisper-ct2-models/large-v3/
```

If the directory exists and has files, the model is already downloaded.

## ⚠️ **Common Issues**

### **Issue: "Model not found" or download fails**
- **Solution**: Check internet connection
- Model downloads from HuggingFace
- May need to retry if connection is unstable

### **Issue: "Out of memory"**
- **Solution**: `large-v3` requires ~4-6GB RAM
- Consider using `large-v3-turbo` (smaller, faster) if available
- Or use `medium` model as fallback

### **Issue: Takes too long**
- **First time**: Normal (downloading 3GB model)
- **Subsequent**: Should be < 1 minute
- If still slow, check disk I/O

## 📝 **Quick Verification**

Once server shows `✅ SERVER_READY`, you can:

1. **Check browser console** - Should see:
   ```
   🚀 Server ready for audio streaming
   ```

2. **Start speaking** - Server will:
   - Auto-detect language
   - Transcribe in detected language
   - Send transcriptions back

## 🎯 **Summary**

- **Command**: `python run_server.py --backend faster_whisper --port 9090`
- **First time**: Wait 10-20 minutes (download + conversion + load)
- **Subsequent**: Wait 30-60 seconds (just loading)
- **Ready when**: You see `✅ SERVER_READY sent to client`
- **Model cached**: Check `~/.cache/whisper-live/whisper-ct2-models/large-v3/`

---

**Start the server and wait for the `✅ SERVER_READY` message - that's when it's ready to accept connections!**

