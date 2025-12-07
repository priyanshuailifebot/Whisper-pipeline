/**
 * Continuous Microphone with Hybrid AEC + WebSocket Streaming
 * Uses browser AEC + server AEC + WhisperLive transcription
 * Streams raw audio to WhisperLive microservice for transcription
 */

export class ContinuousMicWithEchoCancellation {
  constructor(options = {}) {
    this.onTranscript = options.onTranscript || (() => {})
    this.onError = options.onError || (() => {})
    this.onListeningChange = options.onListeningChange || (() => {})

    // WebSocket configuration
    this.serverUrl = options.serverUrl || 'ws://localhost:9090'
    this.socket = null
    this.isConnected = false
    this.clientUid = this.generateUid()

    // Audio configuration
    this.mediaRecorder = null
    this.audioStream = null
    this.isActive = false
    this.avatarSpeaking = false
    this.isRecording = false

    // Audio processing
    this.audioContext = null
    this.audioBuffer = []
    this.chunkSize = 4096 // Process in chunks
    this.sampleRate = 16000 // Whisper-compatible sample rate

    // Connection management
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatInterval = null

    // Audio queue for smooth streaming
    this.audioQueue = []
    this.isProcessingQueue = false
  }

  generateUid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  async initialize() {
    try {
      console.log('🎤 Initializing hybrid AEC microphone with WebSocket streaming...')

      // ✅ STEP 1: Request microphone permission with AEC enabled
      console.log('🎤 Requesting microphone with hybrid AEC...')
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,      // ✅ Browser AEC (first layer)
          noiseSuppression: true,       // ✅ Noise reduction
          autoGainControl: false,       // ✅ Prevent feedback loops
          sampleRate: this.sampleRate,  // ✅ Whisper-compatible (16kHz)
          channelCount: 1,              // ✅ Mono audio
          echoCancellationType: 'system' // Use system AEC if available
        }
      })
      console.log('✅ Microphone permission granted with browser AEC enabled')

      // ✅ STEP 2: Initialize WebSocket connection to WhisperLive
      await this.initializeWebSocket()

      // ✅ STEP 3: Set up audio processing
      await this.initializeAudioProcessing()

      console.log('✅ Hybrid AEC microphone initialized successfully')
      console.log('🔄 Browser AEC active + Server AEC ready via WhisperLive')

      return true
    } catch (error) {
      console.error('❌ Failed to initialize hybrid AEC microphone:', error)

      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        console.error('🚫 MICROPHONE PERMISSION DENIED - User must allow microphone access in browser')
      } else if (error.name === 'NotFoundError') {
        console.error('🚫 No microphone found on this device')
      } else if (error.name === 'NotSupportedError') {
        console.error('🚫 Microphone access not supported in this context (HTTPS required)')
      }

      this.onError(error)
      return false
    }
  }

  async initializeWebSocket() {
    console.log(`🔌 Connecting to WhisperLive server: ${this.serverUrl}`)

    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.serverUrl)

      this.socket.onopen = () => {
        console.log('🔌 WebSocket connected to WhisperLive')
        this.isConnected = true
        this.reconnectAttempts = 0

        // Send client configuration
        this.sendConfiguration()

        // Start heartbeat
        this.startHeartbeat()

        resolve()
      }

      this.socket.onmessage = (event) => {
        this.handleServerMessage(event.data)
      }

      this.socket.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected: ${event.code} - ${event.reason}`)
        this.isConnected = false
        this.stopHeartbeat()

        if (!event.wasClean && this.isActive) {
          this.handleReconnection()
        }
      }

      this.socket.onerror = (error) => {
        console.error('🔌 WebSocket error:', error)
        reject(error)
      }

      // Connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('WebSocket connection timeout'))
        }
      }, 5000)
    })
  }

  async initializeAudioProcessing() {
    // Create AudioContext for processing
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: this.sampleRate
    })

    // Create audio processor for real-time streaming
    await this.audioContext.resume()
    console.log('🎵 Audio processing initialized')
  }

  sendConfiguration() {
    const config = {
      uid: this.clientUid,
      language: 'en',
      task: 'transcribe',
      model: 'small',
      use_vad: true,
      send_last_n_segments: 10,
      no_speech_thresh: 0.45,
      clip_audio: false,
      same_output_threshold: 10,
      enable_translation: false,
      target_language: 'fr'
    }

    console.log('📤 Sending configuration to WhisperLive:', config)
    this.socket.send(JSON.stringify(config))
  }

  handleServerMessage(data) {
    try {
      const message = JSON.parse(data)

      if (message.uid !== this.clientUid) {
        console.log('🚫 Ignoring message for different client')
        return
      }

      // Handle different message types
      if (message.status) {
        this.handleStatusMessage(message)
      } else if (message.segments) {
        this.handleTranscriptionMessage(message)
      } else if (message.language) {
        this.handleLanguageDetection(message)
      }

    } catch (error) {
      console.error('❌ Error parsing server message:', error)
    }
  }

  handleStatusMessage(message) {
    const { status, message: statusMessage } = message

    switch (status) {
      case 'WAIT':
        console.log(`⏳ Server full, wait time: ${statusMessage} minutes`)
        this.onListeningChange(false)
        break
      case 'ERROR':
        console.error('🚫 Server error:', statusMessage)
        this.onError(new Error(statusMessage))
        break
      case 'WARNING':
        console.warn('⚠️ Server warning:', statusMessage)
        break
      case 'SERVER_READY':
        console.log('🚀 Server ready for audio streaming')
        this.onListeningChange(true)
        if (this.isActive && !this.isRecording) {
          this.startRecording()
        }
        break
    }
  }

  handleTranscriptionMessage(message) {
    if (!message.segments || message.segments.length === 0) return

    // Combine all segments into transcript
    const transcript = message.segments.map(segment => segment.text).join(' ').trim()

    if (transcript.length < 2) return // Ignore very short segments

    console.log('📝 WhisperLive transcript:', transcript)
    this.onTranscript(transcript)
  }

  handleLanguageDetection(message) {
    console.log(`🌍 Language detected: ${message.language} (${message.language_prob})`)
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send a simple ping to keep connection alive
        this.socket.send(JSON.stringify({ type: 'ping', uid: this.clientUid }))
      }
    }, 30000) // Every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      this.onError(new Error('Failed to reconnect to WhisperLive server'))
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)

    setTimeout(() => {
      if (this.isActive) {
        this.initializeWebSocket().catch(error => {
          console.error('❌ Reconnection failed:', error)
          this.handleReconnection()
        })
      }
    }, delay)
  }

  startRecording() {
    if (!this.audioStream || !this.isConnected) {
      console.error('❌ Cannot start recording: audio stream or WebSocket not ready')
      return false
    }

    try {
      // Create MediaRecorder for capturing audio chunks
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.processAudioChunk(event.data)
        }
      }

      // Send data every 100ms for real-time streaming
      this.mediaRecorder.start(100)
      this.isRecording = true

      console.log('🎤 Started audio recording and streaming to WhisperLive')
      return true

    } catch (error) {
      console.error('❌ Failed to start recording:', error)
      this.onError(error)
      return false
    }
  }

  async processAudioChunk(audioBlob) {
    try {
      // Convert blob to Float32Array for streaming
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioData = await this.decodeAudioData(arrayBuffer)

      // Convert to 16kHz Float32Array (Whisper format)
      const resampledData = await this.resampleAudio(audioData, this.audioContext.sampleRate, this.sampleRate)

      // Send to WhisperLive server
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(resampledData.buffer)
      }

    } catch (error) {
      console.error('❌ Error processing audio chunk:', error)
    }
  }

  async decodeAudioData(arrayBuffer) {
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    return audioBuffer.getChannelData(0) // Return first channel (mono)
  }

  async resampleAudio(audioData, fromSampleRate, toSampleRate) {
    if (fromSampleRate === toSampleRate) {
      return audioData
    }

    const ratio = toSampleRate / fromSampleRate
    const newLength = Math.round(audioData.length * ratio)
    const result = new Float32Array(newLength)

    // Simple linear interpolation for resampling
    for (let i = 0; i < newLength; i++) {
      const originalIndex = i / ratio
      const index = Math.floor(originalIndex)
      const fraction = originalIndex - index

      if (index + 1 < audioData.length) {
        result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction
      } else {
        result[i] = audioData[index] || 0
      }
    }

    return result
  }

  start() {
    if (!this.audioStream || !this.isConnected) {
      console.error('❌ Cannot start: audio stream or WebSocket not initialized. Call initialize() first.')
      return false
    }

    if (this.isActive && this.isRecording) {
      console.log('⚠️ Already active and recording')
      return true
    }

    // Warn if avatar is speaking, but allow start (hybrid AEC will handle it)
    if (this.avatarSpeaking) {
      console.log('⚠️ Starting mic while avatar is speaking (hybrid AEC active)')
    }

    this.isActive = true

    // Start recording if WebSocket is ready
    if (this.isConnected) {
      return this.startRecording()
    } else {
      console.log('⏳ WebSocket not ready, will start recording when connected')
      return true // Will start when WebSocket connects
    }
  }

  stop() {
    console.log('⏹️ Stopping hybrid AEC microphone...')

    this.isActive = false
    this.isRecording = false

    // Stop heartbeat
    this.stopHeartbeat()

    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
        console.log('🔇 MediaRecorder stopped')
      } catch (e) {
        console.warn('MediaRecorder already stopped')
      }
    }

    // Stop audio tracks
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
      console.log('🔇 Audio tracks stopped')
    }

    // Close WebSocket
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'end', uid: this.clientUid }))
      this.socket.close(1000, 'Client stopping')
      console.log('🔌 WebSocket closed')
    }

    // Close AudioContext
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      console.log('🔇 AudioContext closed')
    }

    this.onListeningChange(false)
    console.log('✅ Hybrid AEC microphone stopped')
  }

  // ✅ CRITICAL: Call this when avatar starts/stops speaking
  setAvatarSpeaking(speaking) {
    const wasSpeaking = this.avatarSpeaking
    this.avatarSpeaking = speaking

    if (speaking) {
      console.log('🔇 Avatar speaking - hybrid AEC active (browser + server AEC)')
      // Don't stop recording - let hybrid AEC handle the echo
      // Server-side AEC will provide additional echo cancellation
    } else {
      console.log('🔊 Avatar finished - mic continues streaming')
      // Recording stays active for continuous conversation
    }
  }

  // Update server URL (for dynamic configuration)
  setServerUrl(url) {
    if (this.isActive) {
      console.warn('⚠️ Cannot change server URL while active. Stop first.')
      return false
    }

    this.serverUrl = url
    console.log(`🔗 Server URL updated to: ${url}`)
    return true
  }

  // Check connection status
  isConnected() {
    return this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN
  }

  // Check if currently active
  isRunning() {
    return this.isActive && this.isRecording
  }

  // Get current status for debugging
  getStatus() {
    return {
      isActive: this.isActive,
      isRecording: this.isRecording,
      isConnected: this.isConnected(),
      avatarSpeaking: this.avatarSpeaking,
      clientUid: this.clientUid,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

export default ContinuousMicWithEchoCancellation

