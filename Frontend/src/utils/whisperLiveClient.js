/**
 * WhisperLive WebSocket Audio Client
 * Replaces browser Speech API with WebSocket-based audio streaming to WhisperLive server
 * Includes hybrid AEC (browser + server) for optimal echo cancellation
 */

export class WhisperLiveClient {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || 'ws://localhost:9090';
    this.onTranscript = options.onTranscript || (() => {});
    this.onError = options.onError || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onConnectionChange = options.onConnectionChange || (() => {});
    
    // Deduplication: Track last processed transcript to avoid processing duplicates
    this.lastProcessedTranscript = null;
    this.lastProcessedTimestamp = null;
    this.processedTranscripts = new Set(); // Track processed transcripts

    // Audio configuration
    this.audioConfig = {
      sampleRate: 16000,
      channels: 1,
      echoCancellation: true,  // Browser AEC
      noiseSuppression: true,   // Additional noise reduction
      autoGainControl: false,   // Prevent feedback loops
    };

    // WebSocket and audio state
    this.socket = null;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioContext = null;
    this.isConnected = false;
    this.isRecording = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;

    // Audio processing
    this.audioChunks = [];
    this.processingInterval = 100; // Send audio every 100ms

    // Client configuration
    this.clientConfig = {
      uid: this.generateUID(),
      language: options.language || null,  // null = auto-detect language
      task: options.task || 'transcribe',
      model: options.model || 'base',  // Use base model
      use_vad: options.useVAD !== false,
      send_last_n_segments: options.sendLastNSegments || 1,  // Reduced from 10 to 1 to prevent repetitive transcriptions
      no_speech_thresh: options.noSpeechThresh || 0.6,  // Increased from 0.45 to 0.6 to be less aggressive (only filter out audio that's 60%+ likely silence)
      enable_translation: options.enableTranslation || false,
      target_language: options.targetLanguage || 'fr',
    };

    console.log('🎤 WhisperLive client initialized:', {
      serverUrl: this.serverUrl,
      config: this.clientConfig
    });
  }

  generateUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to WhisperLive server...', this.serverUrl);
        console.log('📋 WebSocket URL:', this.serverUrl);
        console.log('🔍 Checking if server is reachable...');
        
        // Add timeout to prevent hanging
        const connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            console.error('❌ WebSocket connection timeout after 10 seconds');
            console.error('🔍 Troubleshooting:');
            console.error('   1. Is WhisperLive server running?');
            console.error('   2. Check: python run_server.py --backend faster_whisper --port 9090');
            console.error('   3. Verify server URL:', this.serverUrl);
            if (this.socket) {
              this.socket.close();
            }
            const timeoutError = new Error(`Connection timeout - WhisperLive server may not be running at ${this.serverUrl}`);
            timeoutError.name = 'ConnectionTimeout';
            this.onError(timeoutError);
            reject(timeoutError);
          }
        }, 10000); // 10 second timeout

        console.log('🌐 Creating WebSocket connection...');
        this.socket = new WebSocket(this.serverUrl);

        this.socket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket connected to WhisperLive');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectionChange(true);
          
          // Send client configuration immediately after connection
          // The server needs this before it can send SERVER_READY
          this.sendClientConfig();
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            this.handleServerMessage(event);
          } catch (error) {
            console.error('❌ Error handling server message:', error);
            // Don't throw - continue processing
          }
        };

        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.onConnectionChange(false);

          // Only reject if this was the initial connection attempt
          if (this.socket && this.socket.readyState === WebSocket.CLOSED && this.reconnectAttempts === 0) {
            const closeError = new Error(`Connection closed: ${event.reason || 'Unknown reason'}`);
            closeError.name = 'ConnectionClosed';
            this.onError(closeError);
            reject(closeError);
          } else if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        this.socket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('❌ WebSocket error:', error);
          console.error('🔍 Error details:', {
            url: this.serverUrl,
            readyState: this.socket?.readyState,
            error: error
          });
          console.error('🔧 Troubleshooting:');
          console.error('   1. Check if WhisperLive server is running:');
          console.error('      cd WhisperLive && python run_server.py --backend faster_whisper --port 9090');
          console.error('   2. Verify the server URL is correct:', this.serverUrl);
          console.error('   3. Check server logs for connection attempts');
          console.error('   4. Ensure port 9090 is not blocked by firewall');
          
          // Create a more descriptive error
          const wsError = new Error(`WebSocket connection failed to ${this.serverUrl} - WhisperLive server may not be running`);
          wsError.name = 'WebSocketError';
          wsError.originalError = error;
          
          this.onError(wsError);
          
          // Only reject if socket is actually closed (not just errored)
          if (this.socket && this.socket.readyState === WebSocket.CLOSED) {
            reject(wsError);
          }
        };

      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        const createError = new Error(`Failed to create WebSocket: ${error.message}`);
        createError.name = 'WebSocketCreationError';
        this.onError(createError);
        reject(createError);
      }
    });
  }

  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);

    setTimeout(() => {
      this.connect().catch(() => {
        console.error('❌ Reconnection failed');
      });
    }, delay);
  }

  async startRecording() {
    if (!this.isConnected) {
      const error = new Error('WebSocket not connected. Call connect() first.');
      error.name = 'NotConnected';
      console.warn('⚠️', error.message);
      this.onError(error);
      throw error;
    }

    // Prevent starting recording multiple times
    if (this.isRecording) {
      console.log('ℹ️ Recording already in progress, skipping startRecording()');
      return;
    }

    try {
      console.log('🎤 Starting audio recording with hybrid AEC...');
      console.log('📋 Requesting microphone permission (requires user interaction)...');

      // Step 1: Get microphone access with AEC enabled
      // Note: Browser requires user gesture (click/tap) to grant permission
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: this.audioConfig
      });
      
      // Clear permission waiting flag if we got here
      if (this.waitingForPermission) {
        console.log('✅ Microphone permission granted after user interaction');
        this.waitingForPermission = false;
      }

      console.log('✅ Microphone access granted with AEC settings');

      // Step 2: Create AudioContext for raw PCM audio capture
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.audioConfig.sampleRate
      });

      // Check if audio stream has active tracks
      const audioTracks = this.audioStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in media stream');
      }
      
      const audioTrack = audioTracks[0];
      console.log('🎙️ Audio track info:', {
        enabled: audioTrack.enabled,
        muted: audioTrack.muted,
        readyState: audioTrack.readyState,
        settings: audioTrack.getSettings()
      });

      // Step 3: Create audio source from stream
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      
      // Step 4: Create ScriptProcessorNode for raw PCM capture
      // Note: ScriptProcessorNode is deprecated but widely supported
      // For better performance, consider AudioWorkletNode (requires separate worklet file)
      const bufferSize = 4096; // 4096 samples buffer
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      // Track audio levels for debugging
      this.audioLevelHistory = [];
      this.silentChunkCount = 0;
      
      // Step 5: Set up audio processing callback
      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.isConnected || !this.isRecording) return;
        
        // Get raw PCM audio data (Float32Array)
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Apply audio gain/amplification to improve transcription accuracy
        // Normalize and amplify quiet audio (gain of 2.0 = double the volume)
        const gain = 2.0;
        const amplifiedData = new Float32Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          amplifiedData[i] = Math.max(-1.0, Math.min(1.0, inputData[i] * gain));
        }
        
        // Calculate audio level (RMS) from amplified data
        const audioLevel = Math.sqrt(amplifiedData.reduce((sum, val) => sum + val * val, 0) / amplifiedData.length);
        
        // Track audio levels
        this.audioLevelHistory.push(audioLevel);
        if (this.audioLevelHistory.length > 100) {
          this.audioLevelHistory.shift();
        }
        
        // Check if audio is silent
        if (audioLevel < 0.0001) {
          this.silentChunkCount++;
          // Warn if we've had many silent chunks (every 500 chunks = ~20 seconds)
          if (this.silentChunkCount % 500 === 0 && this.silentChunkCount > 0) {
            console.warn(`⚠️ WARNING: Audio appears to be silent (level: ${audioLevel.toFixed(6)}). Check microphone settings.`);
            console.warn('   • Make sure your microphone is not muted');
            console.warn('   • Check browser microphone permissions');
            console.warn('   • Verify microphone is working in other applications');
          }
        } else {
          this.silentChunkCount = 0; // Reset counter when audio is detected
        }
        
        // Send amplified audio to server (already in Float32 format at correct sample rate)
        if (this.socket && this.socket.readyState === WebSocket.OPEN && amplifiedData.length > 0) {
          try {
            // Ensure we're sending the Float32Array buffer correctly
            // The server expects binary data that can be converted to np.float32
            // Use amplified data instead of raw input
            this.socket.send(amplifiedData.buffer);
            
            // Debug: Log audio sending periodically (every 100 chunks = ~4 seconds at 16kHz)
            if (!this.audioSendCounter) this.audioSendCounter = 0;
            this.audioSendCounter++;
            if (this.audioSendCounter % 100 === 0) {
              const avgLevel = this.audioLevelHistory.slice(-100).reduce((a, b) => a + b, 0) / Math.min(100, this.audioLevelHistory.length);
              const maxLevel = Math.max(...this.audioLevelHistory.slice(-100));
              console.log(`🎤 Audio streaming: chunk ${this.audioSendCounter}, level: ${audioLevel.toFixed(4)}, avg: ${avgLevel.toFixed(4)}, max: ${maxLevel.toFixed(4)}, samples: ${amplifiedData.length}, gain: ${gain}x`);
              
              // Warn if audio is consistently silent (even after amplification)
              if (avgLevel < 0.001) {
                console.warn('⚠️ Audio level is very low even after amplification - check microphone:');
                console.warn('   1. Ensure microphone is not muted');
                console.warn('   2. Check browser microphone permissions');
                console.warn('   3. Try speaking louder or closer to microphone');
                console.warn('   4. Test microphone in another app (QuickTime, etc.)');
              } else if (avgLevel > 0.1) {
                console.log('✅ Audio level is good - transcription should be accurate');
              }
            }
          } catch (error) {
            console.error('❌ Error sending audio data:', error);
          }
        } else {
          // Debug: Log why audio isn't being sent
          if (!this.audioSkipCounter) this.audioSkipCounter = 0;
          this.audioSkipCounter++;
          if (this.audioSkipCounter % 100 === 0) {
            console.warn(`⚠️ Audio not sent: connected=${this.isConnected}, recording=${this.isRecording}, socket=${!!this.socket}, readyState=${this.socket?.readyState}`);
          }
        }
      };

      // Step 6: Connect audio nodes
      // CRITICAL: ScriptProcessorNode requires connection to destination to fire callbacks
      // We need to connect it to keep the audio graph alive, even if we don't play audio
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);
      
      // Note: Even though we connect to destination, no audio will play back
      // because the source is from getUserMedia (input only)

      // Note: Client configuration was already sent in onopen() handler
      // DO NOT send it again here - it will interfere with audio streaming

      // Step 7: Start recording
      this.isRecording = true;

      // Resume AudioContext if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        console.log('🔊 Resuming suspended AudioContext...');
        await this.audioContext.resume();
      }
      console.log('🔊 AudioContext state:', this.audioContext.state);

      console.log('▶️ Audio recording started - streaming raw PCM to WhisperLive');
      console.log(`📊 Sample rate: ${this.audioContext.sampleRate}Hz, Buffer size: 4096 samples`);

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.onError(error);
      // Re-throw but ensure it's handled gracefully
      throw error;
    }
  }

  // setupAudioProcessing and processAndSendAudio are no longer needed
  // Audio is now captured directly as raw PCM via ScriptProcessorNode

  resampleAudio(audioData, fromSampleRate, toSampleRate) {
    const ratio = toSampleRate / fromSampleRate;
    const newLength = Math.round(audioData.length * ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = i / ratio;
      const index = Math.floor(originalIndex);
      const fraction = originalIndex - index;

      if (index + 1 < audioData.length) {
        // Linear interpolation
        result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
      } else {
        result[i] = audioData[index] || 0;
      }
    }

    return result;
  }

  sendClientConfig() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const configMessage = JSON.stringify(this.clientConfig);
      this.socket.send(configMessage);
      console.log('📋 Sent client configuration to server:', {
        uid: this.clientConfig.uid,
        model: this.clientConfig.model,
        language: this.clientConfig.language,
        use_vad: this.clientConfig.use_vad
      });
    } else {
      console.warn('⚠️ Cannot send config - WebSocket not open. State:', this.socket?.readyState);
    }
  }

  handleServerMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // DEBUG: Log all incoming messages to verify communication
      console.log('📨 Received message from server:', {
        hasStatus: !!message.status,
        hasSegments: !!message.segments,
        hasLanguage: !!message.language,
        hasMessage: !!message.message,
        messageKeys: Object.keys(message),
        rawMessage: message
      });

      // Handle different message types
      // Priority order: SERVER_READY > CONFIG_RECEIVED > segments > language > status > other
      if (message.message === 'SERVER_READY') {
        console.log('🚀 Server ready for audio streaming - starting recording now');
        this.onStatusChange('ready');
        // Ensure recording starts after SERVER_READY
        if (!this.isRecording) {
          console.log('▶️ Starting recording after SERVER_READY signal');
          this.startRecording().catch(err => {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              console.warn('⚠️ Microphone permission not granted. Browser requires user interaction.');
              console.warn('💡 User needs to click/tap on the page to grant microphone access.');
              console.warn('🔄 Recording will start automatically after user interaction.');
              // Store that we're waiting for permission
              this.waitingForPermission = true;
              // Don't treat this as a fatal error - user can grant permission on next interaction
              this.onError(new Error('Microphone permission required. Please click anywhere on the page to grant access.'));
            } else {
              console.error('❌ Failed to start recording after SERVER_READY:', err);
              this.onError(err);
            }
          });
        } else {
          console.log('ℹ️ Recording already started, continuing...');
        }
      } else if (message.status === 'CONFIG_RECEIVED') {
        console.log('✅ Server acknowledged client configuration');
      } else if (message.segments) {
        console.log(`✅ Received transcription segments: ${message.segments.length} segments`);
        console.log(`📝 Segment details:`, message.segments.map(s => ({ text: s.text?.substring(0, 50), start: s.start, end: s.end })));
        this.handleTranscriptionMessage(message);
      } else if (message.language) {
        console.log(`🌍 Server detected language: ${message.language} (${message.language_prob})`);
      } else if (message.status) {
        this.handleStatusMessage(message);
      } else if (message.message === 'DISCONNECT') {
        console.log('👋 Server requested disconnect');
        this.stopRecording();
      } else {
        // Log unhandled messages for debugging
        console.log('⚠️ Unhandled message type:', JSON.stringify(message, null, 2));
      }

    } catch (error) {
      console.error('❌ Failed to parse server message:', error, 'Raw data:', event.data);
    }
  }

  handleStatusMessage(message) {
    const { status, message: statusMessage } = message;

    switch (status) {
      case 'WAIT':
        console.log(`⏳ Server full, wait time: ${statusMessage} minutes`);
        this.onStatusChange('waiting', statusMessage);
        break;
      case 'ERROR':
        console.error('❌ Server error:', statusMessage);
        this.onError(new Error(statusMessage));
        break;
      case 'WARNING':
        console.warn('⚠️ Server warning:', statusMessage);
        break;
    }
  }

  handleTranscriptionMessage(message) {
    const { segments, translated_segments } = message;

    console.log('🔍 Processing transcription message:', {
      segmentsCount: segments?.length || 0,
      segments: segments,
      translatedSegmentsCount: translated_segments?.length || 0
    });

    if (segments && segments.length > 0) {
      // Combine all segment text
      const fullTranscript = segments.map(seg => seg.text).join(' ').trim();

      if (fullTranscript) {
        // AGGRESSIVE DEDUPLICATION: Check if this is the same transcript as last time
        // Create a hash of the transcript for comparison
        const transcriptHash = this.createTranscriptHash(fullTranscript, segments);
        
        // Check if we've already processed this exact transcript recently (within last 10 seconds - increased from 2)
        const timeSinceLastProcess = this.lastProcessedTimestamp ? Date.now() - this.lastProcessedTimestamp : Infinity;
        if (this.processedTranscripts.has(transcriptHash) && timeSinceLastProcess < 10000) {
          console.log('⏭️ Skipping duplicate transcript (processed recently):', fullTranscript.substring(0, 50) + '...');
          return; // Skip processing duplicate
        }
        
        // Check if transcript is exactly the same as last one (increased window to 10 seconds)
        if (this.lastProcessedTranscript === fullTranscript && timeSinceLastProcess < 10000) {
          console.log('⏭️ Skipping identical transcript (no changes, processed', Math.round(timeSinceLastProcess), 'ms ago)');
          return; // Skip if exactly the same and recent
        }
        
        // Check if transcript is just a prefix/substring of the last one (incremental update)
        // More aggressive: 90% similar = likely same transcript (was 95%)
        if (this.lastProcessedTranscript && timeSinceLastProcess < 10000) {
          const similarity = this.calculateSimilarity(this.lastProcessedTranscript, fullTranscript);
          if (similarity > 0.90) { // 90% similar = likely same transcript (more aggressive than 95%)
            console.log('⏭️ Skipping highly similar transcript (', (similarity * 100).toFixed(1), '% similar)');
            return;
          }
        }
        
        // Mark as processed
        this.processedTranscripts.add(transcriptHash);
        this.lastProcessedTranscript = fullTranscript;
        this.lastProcessedTimestamp = Date.now();
        
        // Clean up old entries (keep last 50, increased from 20)
        if (this.processedTranscripts.size > 50) {
          const entries = Array.from(this.processedTranscripts);
          this.processedTranscripts = new Set(entries.slice(-50));
        }
        
        console.log('📝 New transcription:', fullTranscript);
        console.log('📤 Calling onTranscript callback with:', { fullTranscript, segmentsCount: segments.length });
        this.onTranscript(fullTranscript, segments);
      } else {
        console.warn('⚠️ Empty transcript - segments exist but no text:', segments);
      }
    } else {
      console.warn('⚠️ No segments in transcription message:', message);
    }

    // Handle translated segments if present
    if (translated_segments && translated_segments.length > 0) {
      const fullTranslation = translated_segments.map(seg => seg.text).join(' ').trim();
      if (fullTranslation) {
        console.log('🌍 Translation:', fullTranslation);
        // You can add a separate callback for translations if needed
      }
    }
  }
  
  createTranscriptHash(transcript, segments) {
    // Create a hash based on transcript text and segment structure
    // This helps identify duplicate messages even if timestamps differ
    const segmentTexts = segments.map(s => s.text).join('|');
    const segmentCount = segments.length;
    // Simple hash: transcript + segment count + first/last segment text
    const hash = `${transcript.substring(0, 100)}_${segmentCount}_${segments[0]?.text || ''}_${segments[segments.length - 1]?.text || ''}`;
    return hash;
  }
  
  calculateSimilarity(str1, str2) {
    // Simple similarity calculation using character matching
    // Returns a value between 0 (completely different) and 1 (identical)
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    // If one is a substring of the other, calculate similarity
    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }
    
    // Simple character-based similarity
    let matches = 0;
    const minLength = Math.min(str1.length, str2.length);
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    return matches / Math.max(str1.length, str2.length);
  }

  stopRecording() {
    console.log('⏹️ Stopping audio recording...');

    this.isRecording = false;

    // Disconnect ScriptProcessorNode
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    // Send end-of-audio signal
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send('END_OF_AUDIO');
    }

    console.log('✅ Audio recording stopped');
  }

  disconnect() {
    this.stopRecording();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isConnected = false;
    
    // Reset deduplication state
    this.lastProcessedTranscript = null;
    this.lastProcessedTimestamp = null;
    this.processedTranscripts.clear();
    
    console.log('🔌 WhisperLive client disconnected');
  }

  // Get current status
  getStatus() {
    return {
      connected: this.isConnected,
      recording: this.isRecording,
      serverUrl: this.serverUrl,
      clientConfig: this.clientConfig
    };
  }

  // Update client configuration
  updateConfig(newConfig) {
    this.clientConfig = { ...this.clientConfig, ...newConfig };
    console.log('⚙️ Client configuration updated:', newConfig);

    // Send updated config if connected
    if (this.isConnected) {
      this.sendClientConfig();
    }
  }
}
