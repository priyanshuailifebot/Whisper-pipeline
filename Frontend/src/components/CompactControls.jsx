import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef } from 'react'
import nassicomLogo from '../assets/nasscom-coe.jpeg'
import microsoftLogo from '../assets/Microsoft_logo_(2012).svg.png'
import './CompactControls.css'

const CompactControls = ({ 
  isListening, 
  transcript, 
  onStartListening, 
  onStopListening,
  isStarted,
  avatarSpeaking = false,
  conversationMode = 'wake-word' // 'wake-word' or 'continuous'
}) => {
  const recognitionRef = useRef(null)
  const wakeWordListenerRef = useRef(null)
  const isListeningRef = useRef(isListening)
  const avatarSpeakingRef = useRef(avatarSpeaking)
  const conversationModeRef = useRef(conversationMode)
  const recentTranscriptsRef = useRef([]) // Track recent transcripts for "Meera" + "Hello" detection
  
  // Keep refs in sync with props
  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])
  
  useEffect(() => {
    avatarSpeakingRef.current = avatarSpeaking
  }, [avatarSpeaking])
  
  useEffect(() => {
    conversationModeRef.current = conversationMode
  }, [conversationMode])

  // Initialize Main Speech Recognition (for active listening)
  // ONLY in wake-word mode - continuous mode uses its own microphone system
  useEffect(() => {
    if (!isStarted) return
    
    // Don't initialize main recognition in continuous mode
    if (conversationMode === 'continuous') {
      console.log('⏭️ Skipping main recognition - in continuous mode (handled by ContinuousMic)')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('⚠️ Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false // Stops after one utterance
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      console.log('🎤 Main recognition started')
      onStartListening()
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }

      if (finalTranscript && window.handleVoiceInput) {
        console.log('🗣️ Final transcript:', finalTranscript)
        window.handleVoiceInput(finalTranscript.trim())
      }
    }

    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error)
      // Auto-stop on error
      onStopListening()
    }

    recognition.onend = () => {
      console.log('🎤 Main recognition ended - mic turning OFF')
      // CRITICAL: Always stop listening when recognition ends
      onStopListening()
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore if already stopped
        }
      }
    }
  }, [isStarted, conversationMode, onStartListening, onStopListening])

  // Initialize Always-On Wake Word Listener (ONLY in wake-word mode)
  useEffect(() => {
    if (!isStarted) return
    
    // ONLY run wake word listener in wake-word mode
    if (conversationMode !== 'wake-word') {
      console.log('⏭️ Skipping wake word listener - in continuous conversation mode')
      // Stop wake word listener if it's running
      if (wakeWordListenerRef.current) {
        try {
          wakeWordListenerRef.current.stop()
          wakeWordListenerRef.current = null
        } catch (e) {
          // Already stopped
        }
      }
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const wakeWordListener = new SpeechRecognition()
    wakeWordListener.continuous = true // Always listening
    wakeWordListener.interimResults = true
    wakeWordListener.lang = 'en-US'

    wakeWordListener.onstart = () => {
      console.log('👂 Wake word listener started (wake-word mode)')
    }

    wakeWordListener.onresult = (event) => {
      // Get current state values using refs
      const currentlyListening = isListeningRef.current
      const currentlySpeaking = avatarSpeakingRef.current
      
      // CRITICAL: Don't process if main recognition is already active
      if (currentlyListening) {
        console.log('⏸️ Wake word listener paused - main recognition is active')
        return
      }

      // CRITICAL: Don't process if avatar is speaking (prevents echo detection)
      if (currentlySpeaking) {
        console.log('⏸️ Wake word listener ignoring input - avatar is speaking (echo prevention)')
        return
      }

      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      const combinedTranscript = (finalTranscript + ' ' + interimTranscript).toLowerCase().trim()
      
      // Skip empty or very short transcripts
      if (!combinedTranscript || combinedTranscript.length < 2) {
        return
      }

      // Store recent transcripts for pattern detection (keep last 3, max 5 seconds old)
      const now = Date.now()
      recentTranscriptsRef.current = recentTranscriptsRef.current.filter(t => now - t.timestamp < 5000)
      if (finalTranscript) {
        recentTranscriptsRef.current.push({
          text: combinedTranscript,
          timestamp: now
        })
        // Keep only last 3
        if (recentTranscriptsRef.current.length > 3) {
          recentTranscriptsRef.current.shift()
        }
      }

      // Avatar NOT speaking - Look for wake words to activate
      // Expanded wake words list with variations (case-insensitive matching)
      const wakeWords = [
        'hey mira', 'hi mira', 'hello mira', 
        'hey meera', 'hi meera', 'hello meera',
        'ok mira', 'okay mira', 'ok meera', 'okay meera',
        'mira', 'meera' // Standalone names
      ]
      
      // Normalize transcript for better matching (remove extra spaces, handle variations)
      const normalizedTranscript = combinedTranscript.replace(/\s+/g, ' ').trim()
      
      // Check for direct wake word match (more flexible)
      const hasWakeWord = wakeWords.some(word => {
        // Exact match
        if (normalizedTranscript.includes(word)) return true
        // Match with variations (e.g., "hey meera" matches "hey meera")
        const wordVariations = word.split(' ')
        if (wordVariations.length > 1) {
          // Check if all parts of the wake word are present
          return wordVariations.every(part => normalizedTranscript.includes(part))
        }
        return false
      })
      
      // Check for "Meera" + "Hello" pattern (said separately within 5 seconds)
      const recentTexts = recentTranscriptsRef.current.map(t => t.text).join(' ')
      const allText = (normalizedTranscript + ' ' + recentTexts).toLowerCase()
      
      // More flexible pattern matching
      const hasMeera = /\b(meera|mira)\b/i.test(allText)
      const hasHello = /\b(hello|hi|hey)\b/i.test(allText)
      const hasMeeraHello = hasMeera && hasHello
      
      // Check for "Hey Meera" or "Hi Meera" variations (words can be in any order)
      const hasHeyMeera = (
        (/\b(hey|hi)\b/i.test(allText) && /\b(meera|mira)\b/i.test(allText)) ||
        (/\b(meera|mira)\b/i.test(allText) && /\b(hey|hi|hello)\b/i.test(allText))
      )

      if (hasWakeWord || hasMeeraHello || hasHeyMeera) {
        console.log('🎤 Wake word detected!', { combinedTranscript, recentTexts, hasWakeWord, hasMeeraHello, hasHeyMeera })
        
        // Remove wake word from transcript
        let cleanTranscript = finalTranscript
        wakeWords.forEach(word => {
          cleanTranscript = cleanTranscript.replace(new RegExp(word, 'gi'), '').trim()
        })
        // Also remove "hello" if it was part of the wake pattern
        if (hasMeeraHello) {
          cleanTranscript = cleanTranscript.replace(/\b(hello|hi|hey)\b/gi, '').trim()
        }
        
        // Clear recent transcripts after detection
        recentTranscriptsRef.current = []
        
        // If there's content after wake word, process it directly
        if (cleanTranscript && cleanTranscript.length > 2 && window.handleVoiceInput) {
          console.log('📝 Processing command after wake word:', cleanTranscript)
          window.handleVoiceInput(cleanTranscript)
        } else if (window.handleWakeWord) {
          // Just wake up the assistant (no command after wake word)
          console.log('👋 Wake word only - activating mic')
          window.handleWakeWord()
        }
      }
    }

    wakeWordListener.onerror = (event) => {
      console.error('❌ Wake word listener error:', event.error)
      // Don't restart on abort - it means we intentionally stopped it
      if (event.error === 'aborted') {
        console.log('👂 Wake word listener aborted - will restart when needed')
        return
      }
      // Auto-restart on other errors
      if (event.error !== 'no-speech') {
        setTimeout(() => {
          try {
            if (wakeWordListenerRef.current && !isListeningRef.current && !avatarSpeakingRef.current) {
              wakeWordListener.start()
            }
          } catch (e) {
            // Ignore
          }
        }, 1000)
      }
    }

    wakeWordListener.onend = () => {
      console.log('👂 Wake word listener ended')
      // Use refs to get current state values
      const currentlyListening = isListeningRef.current
      const currentlySpeaking = avatarSpeakingRef.current
      
      // Only restart if:
      // 1. Main recognition is NOT active (prevents conflict)
      // 2. Avatar is NOT speaking (prevents echo detection)
      if (!currentlyListening && !currentlySpeaking) {
        console.log('🔄 Restarting wake word listener (ready to listen)')
        
        setTimeout(() => {
          try {
            if (wakeWordListenerRef.current && !isListeningRef.current && !avatarSpeakingRef.current) {
              wakeWordListener.start()
            }
          } catch (e) {
            // Ignore if already running
          }
        }, 500)
      } else {
        const reason = currentlyListening ? 'main recognition active' : 'avatar speaking (echo prevention)'
        console.log(`⏸️ Not restarting wake word listener (${reason})`)
      }
    }

    wakeWordListenerRef.current = wakeWordListener

    // Start wake word listener
    try {
      wakeWordListener.start()
    } catch (err) {
      console.error('Error starting wake word listener:', err)
    }

    return () => {
      if (wakeWordListenerRef.current) {
        try {
          wakeWordListenerRef.current.stop()
          wakeWordListenerRef.current = null
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [isStarted, conversationMode]) // Recreate when session starts or mode changes

  // Manage wake word listener based on avatar speaking state (echo prevention)
  // ONLY in wake-word mode
  useEffect(() => {
    if (!wakeWordListenerRef.current || !isStarted || conversationMode !== 'wake-word') return

    if (avatarSpeaking) {
      // Avatar started speaking - STOP wake word listener to prevent echo
      console.log('🔇 Avatar speaking - stopping wake word listener (echo prevention)')
      try {
        wakeWordListenerRef.current.stop()
      } catch (err) {
        // Already stopped, that's ok
      }
    } else if (!isListening) {
      // Avatar finished speaking AND main recognition is NOT active - RESTART wake word listener
      console.log('🔊 Avatar finished - restarting wake word listener (wake-word mode)')
      setTimeout(() => {
        try {
          if (wakeWordListenerRef.current && !isListening && !avatarSpeaking && conversationMode === 'wake-word') {
            wakeWordListenerRef.current.start()
          }
        } catch (err) {
          // Already running or error, that's ok
        }
      }, 500)
    }
  }, [avatarSpeaking, isListening, isStarted, conversationMode])

  // Auto-start/stop main recognition based on isListening state
  // ONLY in wake-word mode - continuous mode uses its own microphone system
  useEffect(() => {
    // Skip if in continuous mode - microphone handled by ContinuousMic
    if (conversationMode === 'continuous') return
    
    if (!recognitionRef.current) return

    if (isListening) {
      // Starting main recognition (wake-word mode only)
      console.log('▶️ Main recognition activated (wake-word mode)')
      
      // Stop wake word listener in wake-word mode
      if (wakeWordListenerRef.current) {
        try {
          wakeWordListenerRef.current.stop()
        } catch (err) {
          // Already stopped, that's ok
        }
      }
      
      // Start main recognition if not already running
      try {
        recognitionRef.current.start()
      } catch (err) {
        // Might already be running, that's ok
        if (err.message && !err.message.includes('already')) {
          console.error('Error auto-starting recognition:', err)
        }
      }
    } else {
      // Stopping main recognition (wake-word mode only)
      console.log('⏹️ Main recognition deactivated')
      
      // Stop main recognition if running
      try {
        recognitionRef.current.stop()
      } catch (err) {
        // Might already be stopped, that's ok
      }
      
      // Restart wake word listener if avatar is NOT speaking (to prevent echo)
      if (!avatarSpeaking) {
        setTimeout(() => {
          if (wakeWordListenerRef.current && !isListening && !avatarSpeaking) {
            try {
              wakeWordListenerRef.current.start()
              console.log('🔄 Wake word listener restarted after main recognition stopped (wake-word mode)')
            } catch (err) {
              // Already running or error, that's ok
            }
          }
        }, 500)
      }
    }
  }, [isListening, avatarSpeaking, conversationMode])

  if (!isStarted) {
    return null
  }

  const handleMicClick=()=>{
    // In continuous mode, microphone is always-on (WhisperLive handles it)
    // Mic button is disabled/visual-only in continuous mode
    if (conversationMode === 'continuous') {
      console.log('ℹ️ Microphone is always-on in continuous mode - no action needed')
      return
    }
    // In wake-word mode, toggle listening state
    if(isListening){onStopListening()}else{onStartListening()}
  }

  return (
    <motion.div 
      className="compact-controls"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="controls-content">
        {/* Supported By Section - At the beginning */}
        <div className="supported-by-section">
          <span className="supported-by-text">Supported by</span>
          <div className="supported-logo">
            <img src={nassicomLogo} alt="NASSCOM CoE" />
          </div>
          <div className="supported-logo">
            <img src={microsoftLogo} alt="Microsoft" />
          </div>
        </div>

        {/* Mic Button - Centered */}
        <motion.button
          className={`mic-control ${(isListening || conversationMode === 'continuous') ? 'listening' : ''} ${conversationMode === 'continuous' ? 'always-on' : ''}`}
          onClick={handleMicClick}
          whileHover={conversationMode === 'continuous' ? {} : { scale: 1.05 }}
          whileTap={conversationMode === 'continuous' ? {} : { scale: 0.95 }}
          animate={(isListening || conversationMode === 'continuous') ? {
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0.7)',
              '0 0 0 20px rgba(239, 68, 68, 0)',
              '0 0 0 0 rgba(239, 68, 68, 0.7)'
            ]
          } : {}}
          transition={(isListening || conversationMode === 'continuous') ? {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          } : {}}
          title={conversationMode === 'continuous' ? 'Microphone is always-on (continuous mode)' : (isListening ? 'Click to stop listening' : 'Click to start listening')}
        >
          {(isListening || conversationMode === 'continuous') ? <Mic size={28} /> : <Mic size={28} />}
        </motion.button>

        <div className={`transcript-display ${transcript ? 'active' : ''}`}>
          {transcript || (conversationMode === 'continuous' ? 'Always listening - speak naturally' : 'Tap microphone to speak')}
        </div>
      </div>
    </motion.div>
  )
}

export default CompactControls
