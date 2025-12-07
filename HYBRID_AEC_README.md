# Hybrid AEC Implementation for WhisperLive Kiosk System

## Overview

This implementation provides **hybrid acoustic echo cancellation (AEC)** for the kiosk system, combining browser-level AEC with server-side AEC for optimal voice interaction quality. The system replaces the browser Speech API with WebSocket-based audio streaming to WhisperLive server.

## Architecture

### Before (Speech API)
```
Browser Speech API → Text → AI Processing → Avatar Response
     ↓
Basic Browser AEC only
```

### After (Hybrid AEC)
```
Browser AEC → Audio Streaming → Server AEC → Transcription → Text Processing
     ↓              ↓                  ↓              ↓
getUserMedia   WebSocket          WebRTC AEC    Whisper Model
echoCancellation=true           Processing      (faster_whisper)
```

## Components

### 1. Frontend: WhisperLiveClient (`src/utils/whisperLiveClient.js`)

**Features:**
- WebSocket connection to WhisperLive server
- Browser AEC via `getUserMedia` constraints
- Real-time audio streaming (100ms chunks)
- Automatic reconnection on network failures
- Status monitoring and error handling

**Key Configuration:**
```javascript
const audioConfig = {
  sampleRate: 16000,        // Whisper-compatible
  channels: 1,             // Mono audio
  echoCancellation: true,  // Browser AEC
  noiseSuppression: true,  // Additional filtering
  autoGainControl: false,  // Prevent feedback loops
};
```

### 2. Server: AudioProcessor (`whisper_live/preprocessing/audio_processor.py`)

**Features:**
- Server-side AEC using WebRTC Audio Processing
- Audio normalization and enhancement
- Dynamic range compression
- High-pass filtering

**AEC Capabilities:**
- WebRTC AEC with delay-agnostic mode
- Extended filter for complex echoes
- High suppression level for kiosk environments

### 3. Integration: Modified App.jsx

**Changes:**
- Replaced `ContinuousMicWithEchoCancellation` with `WhisperLiveClient`
- Updated audio processing pipeline
- Added connection status monitoring
- Maintained existing conversation flow

## Installation & Setup

### 1. Install Server Dependencies

```bash
cd WhisperLive
pip install webrtc-audio-processing
```

### 2. Environment Configuration

Create environment variables for the frontend:

```bash
# .env file in Frontend directory
REACT_APP_WHISPER_SERVER_URL=ws://localhost:9090
```

### 3. Start Services

**Terminal 1: WhisperLive Server**
```bash
cd WhisperLive
python run_server.py --backend faster_whisper --port 9090
```

**Terminal 2: Frontend**
```bash
cd Frontend
npm install
npm run dev
```

## Testing

### Automated Testing

Run the comprehensive test suite:

```bash
python test_hybrid_aec_system.py
```

This tests:
- ✅ WebRTC AEC library import
- ✅ AEC processor functionality
- ✅ WhisperLive server imports
- ✅ WebSocket connectivity
- ✅ Audio streaming simulation

### Manual Testing

1. **Start both services** (server + frontend)
2. **Switch to continuous mode** in the kiosk
3. **Test echo scenarios:**
   - Speak while avatar is silent (baseline)
   - Speak while avatar is responding (echo test)
   - Use external speakers near microphone
4. **Monitor console logs** for AEC status messages

## AEC Performance

### Browser AEC (First Line of Defense)
- **Latency:** 0ms (immediate)
- **Scope:** Basic echo removal
- **Resource Usage:** Minimal

### Server AEC (Advanced Processing)
- **Latency:** ~50-100ms
- **Scope:** Complex echo patterns, delay-agnostic
- **Resource Usage:** Moderate (GPU acceleration available)

### Combined Benefits
- **Redundancy:** Double protection against echo
- **Coverage:** Handles both immediate and delayed feedback
- **Quality:** Superior transcription accuracy in noisy environments

## Troubleshooting

### Common Issues

**1. WebRTC AEC Not Available**
```
Error: webrtc-audio-processing not available
```
**Solution:**
```bash
pip install webrtc-audio-processing
# On some systems, you may need:
pip install webrtc-audio-processing --no-binary webrtc-audio-processing
```

**2. WebSocket Connection Failed**
```
Error: WebSocket connection to 'ws://localhost:9090' failed
```
**Solutions:**
- Ensure WhisperLive server is running: `python run_server.py --port 9090`
- Check firewall settings for port 9090
- Verify server is accessible: `curl http://localhost:9090`

**3. Microphone Permission Denied**
```
Error: NotAllowedError: Permission denied
```
**Solution:**
- Ensure HTTPS in production (required for microphone access)
- Check browser permissions
- Verify microphone is not in use by other applications

### Debug Commands

**Frontend Debug:**
```javascript
// Check client status
window.checkMicStatus()

// Force restart client
window.forceStartMic()

// Force stop client
window.forceStopMic()
```

**Server Debug:**
```python
# Check AEC processor status
from whisper_live.preprocessing.audio_processor import AudioProcessor
processor = AudioProcessor(enable_aec=True)
print(processor.get_stats())
```

## Performance Metrics

### Expected Performance
- **Audio Latency:** < 200ms end-to-end
- **Transcription Latency:** 500-1000ms (depending on model)
- **Echo Reduction:** 20-30dB (typical for WebRTC AEC)
- **CPU Usage:** 10-20% additional for AEC processing

### Monitoring

Enable detailed logging:
```bash
# Server logs
python run_server.py --backend faster_whisper --port 9090

# Frontend console logs show AEC status
# Look for: "🎯 Hybrid AEC enabled", "🎵 Audio processed chunk"
```

## Production Deployment

### Docker Setup
```dockerfile
# Dockerfile for WhisperLive with AEC
FROM whisper-live-cpu:latest
RUN pip install webrtc-audio-processing
EXPOSE 9090
CMD ["python", "run_server.py", "--backend", "faster_whisper", "--port", "9090"]
```

### Environment Variables
```bash
# Production environment
REACT_APP_WHISPER_SERVER_URL=wss://your-whisper-server.com:9090
REACT_APP_ENV=production
```

### Scaling Considerations
- **Multiple Kiosks:** Single WhisperLive server can handle 4 concurrent connections
- **Load Balancing:** Use nginx or similar for multiple server instances
- **GPU Acceleration:** Enable TensorRT backend for better performance
- **Monitoring:** Implement health checks and metrics collection

## Security Considerations

- **HTTPS Required:** WebSocket connections must be secure in production
- **CORS:** Configure proper CORS headers for WebSocket connections
- **Rate Limiting:** Implement connection limits to prevent abuse
- **Audio Privacy:** Ensure audio data is encrypted in transit

## Future Enhancements

1. **Adaptive AEC:** Adjust AEC parameters based on environment
2. **Speaker Reference:** Provide speaker audio for better echo modeling
3. **Multi-Channel AEC:** Support for stereo or multi-microphone setups
4. **Machine Learning AEC:** Use neural network-based echo cancellation

---

## Summary

The hybrid AEC system provides enterprise-grade voice interaction quality for kiosk environments by combining browser and server-side echo cancellation. The WebSocket-based architecture enables real-time audio streaming with continuous transcription, making it ideal for interactive AI conversations where speaker feedback would otherwise interfere with user input.
