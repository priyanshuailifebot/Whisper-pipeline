import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import KioskHeader from './components/KioskHeader'
import AvatarPanel from './components/AvatarPanel'
import ContentPanel from './components/ContentPanel'
import CompactControls from './components/CompactControls'
import LanguageSelector from './components/LanguageSelector'
import WelcomeScreen from './components/WelcomeScreen'
import TimeoutManager from './components/TimeoutManager'
import ConversationHistoryPanel from './components/ConversationHistoryPanel'
import MicrophoneTest from './components/MicrophoneTest'
import { getContentForQuery, getContentById, wantsSlide, convertRAGCardsToSections } from './utils/contentEngine'
import { analyzePersona, shouldInferPersona, getPersonalizedResponse } from './utils/personaDetection'
import { sendTextToAvatar, interruptAvatar } from './utils/avatarStream'
import { getAIResponse, handleWakeWord, clearSession } from './services/aiService'
import { generateDynamicContent } from './services/dynamicContentGenerator'
import { detectIntent } from './services/intentDetection.js'
import { initializeKnowledgeBase } from './services/knowledgeBase.js'
import { getImmediateAcknowledgment, queryRAGService, getRAGHealth } from './services/ragService'
import { extractVideoId } from './services/videoService'
import { WhisperLiveClient } from './utils/whisperLiveClient'
import DynamicContentRenderer from './components/DynamicContentRenderer'
import './App.css'
import './components/HistoryButton.css'
import AvatarOverlay from './components/AvatarOverlay'

function App() {
  const { width, height } = useWindowSize()
  const [theme, setTheme] = useState('light') // 'light' or 'dark' - Light is default
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true)
  const [isStarted, setIsStarted] = useState(false)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [currentSlide, setCurrentSlide] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [userMessages, setUserMessages] = useState([]) // Track user messages only for persona detection
  const [detectedPersona, setDetectedPersona] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // Avatar/WebRTC status
  const [whisperLiveStatus, setWhisperLiveStatus] = useState('disconnected') // WhisperLive status
  const [showConfetti, setShowConfetti] = useState(false)
  const [lastUserActivity, setLastUserActivity] = useState(Date.now())
  const [showTimeout, setShowTimeout] = useState(false)
  const [avatarSpeaking, setAvatarSpeaking] = useState(false)
  const [conversationMode, setConversationMode] = useState('continuous') // 'wake-word' or 'continuous'
  const [webrtcReady, setWebrtcReady] = useState(false)
  const [lastAvatarSpeechEnd, setLastAvatarSpeechEnd] = useState(Date.now())
  const [videoInfo, setVideoInfo] = useState(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false)
  const [lastTopicContext, setLastTopicContext] = useState(null)
  const [pendingVideoSuggestion, setPendingVideoSuggestion] = useState(null)
  
  // Use refs to track latest state values in event handlers
  const isListeningRef = useRef(isListening)
  const conversationModeRef = useRef(conversationMode)
  const webrtcReadyRef = useRef(webrtcReady)
  const whisperLiveClientRef = useRef(null)
  
  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])
  
  useEffect(() => {
    conversationModeRef.current = conversationMode
  }, [conversationMode])

  // Track currentSlide changes for debugging
  useEffect(() => {
    if (currentSlide) {
      console.log('📺 currentSlide updated:', {
        display_type: currentSlide.display_type,
        title: currentSlide.title,
        has_cards: !!currentSlide.cards,
        cards_count: currentSlide.cards?.length || 0
      })
    } else {
      console.log('📺 currentSlide cleared (set to null)')
    }
  }, [currentSlide])
  
  useEffect(() => {
    webrtcReadyRef.current = webrtcReady
  }, [webrtcReady])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Initialize knowledge base and RAG service on app start
  useEffect(() => {
    initializeKnowledgeBase()

    // Check RAG service health
    getRAGHealth().then(health => {
      if (health.status === 'healthy') {
        console.log('🎯 RAG service is healthy and ready')
      } else {
        console.warn('⚠️ RAG service health check failed:', health)
      }
    }).catch(error => {
      console.warn('⚠️ RAG service not available:', error)
    })
  }, [])

  const handleWelcomeComplete = () => {
    setShowWelcomeScreen(false)
    setIsStarted(true)
    // SKIP language selector - go directly to avatar
    setShowLanguageSelector(false)
    setConnectionStatus('connecting')
    setShowConfetti(true)

    // DON'T show welcome slide - let avatar be full-screen until user asks for details
    // setCurrentSlide(getContentForQuery('welcome'))

    // CRITICAL: Wait for WebRTC connection before sending welcome message
    const handleWebRTCReady = () => {
      if (webrtcReadyRef.current) {
        console.log('⚠️ WebRTC already handled, skipping duplicate')
        return
      }
      
      console.log('🎉 WebRTC CONNECTED - now safe to send welcome message')
      setWebrtcReady(true)
      setConnectionStatus('connected')
      setTimeout(() => setShowConfetti(false), 3000)
      
      // Wait a bit for session ID to be set in DOM, then send welcome
      setTimeout(() => {
        const sessionId = document.getElementById('sessionid')?.value
        console.log('🔍 Session ID in DOM:', sessionId)
        
        if (sessionId && sessionId !== '0') {
          console.log('✅ Valid session ID found - sending welcome message')
          handleLanguageSelect('en')
        } else {
          console.warn('⚠️ Session ID still not set, waiting longer...')
          setTimeout(() => {
            handleLanguageSelect('en')
          }, 1000)
        }
      }, 500)
      
      // Remove listener after use
      window.removeEventListener('webrtc-connected', handleWebRTCReady)
    }
    
    window.addEventListener('webrtc-connected', handleWebRTCReady)
    
    // NO FALLBACK - Don't send welcome if WebRTC doesn't connect
    // User can manually click mic to interact
  }

  const handleStart = () => {
    // This is now only used if someone manually triggers start
    handleWelcomeComplete()
  }

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang)
    setShowLanguageSelector(false)
    
    // Get personalized welcome message from AI
    const welcomeMessage = handleWakeWord()
    
    // Add welcome message
    setConversationHistory([
      {
        speaker: 'assistant',
        text: welcomeMessage,
        timestamp: new Date().toLocaleTimeString(),
        isAI: true
      }
    ])
    
    // Send welcome message immediately (WebRTC should already be connected at this point)
    console.log('📤 Sending welcome message (WebRTC should be connected)')
    sendTextToAvatar(welcomeMessage).catch(err => {
      console.error('Failed to send welcome to avatar:', err)
    })
  }

  // Listen for avatar speaking events
  useEffect(() => {
    const handleAvatarSpeakingStart = () => {
      console.log('🗣️ Avatar started speaking')
      // Don't set avatar speaking if video is playing
      if (!isVideoPlaying) {
        setAvatarSpeaking(true)
        // NOTE: In continuous mode, we DON'T stop the mic - it filters input automatically
        // Only stop listening UI state in wake-word mode
        if (conversationMode === 'wake-word' && isListening) {
          console.log('🔇 Stopping wake-word mic - avatar is speaking')
          handleStopListening()
        }
      } else {
        console.log('🔇 Avatar speaking blocked - video is playing')
      }
    }
    
    const handleAvatarSpeakingEnd = () => {
      console.log('✅ Avatar finished speaking')
      // Don't process if video is playing
      if (isVideoPlaying) {
        console.log('🔇 Avatar end event ignored - video is playing')
        return
      }
      
      setAvatarSpeaking(false)
      setLastAvatarSpeechEnd(Date.now())
      
      // Use refs to get current values
      const currentMode = conversationModeRef.current
      
      // CONTINUOUS CONVERSATION MODE: Auto-enable mic after avatar finishes
      if (currentMode === 'continuous') {
        console.log('🎤 AUTO-ENABLING MIC (continuous conversation mode)')
        setTimeout(() => {
          // Check current state using refs
          const stillInContinuousMode = conversationModeRef.current === 'continuous'
          const notCurrentlyListening = !isListeningRef.current
          
          console.log('🔍 Auto-enable check:', {
            mode: conversationModeRef.current,
            isListening: isListeningRef.current,
            willEnable: stillInContinuousMode && notCurrentlyListening
          })
          
          if (stillInContinuousMode && notCurrentlyListening) {
            console.log('▶️ Starting recognition (auto-enable after avatar)')
            setIsListening(true)
            setTranscript('Listening...')
            handleUserActivity()
          } else {
            console.log('⚠️ Cannot auto-enable - already listening or mode changed')
          }
        }, 1000) // Increased delay to ensure avatar is completely done
      } else {
        console.log('👂 Wake word mode - waiting for wake word')
      }
    }
    
    window.addEventListener('avatar-speaking-start', handleAvatarSpeakingStart)
    window.addEventListener('avatar-speaking-end', handleAvatarSpeakingEnd)
    
    return () => {
      window.removeEventListener('avatar-speaking-start', handleAvatarSpeakingStart)
      window.removeEventListener('avatar-speaking-end', handleAvatarSpeakingEnd)
    }
  }, [isStarted, conversationMode, isVideoPlaying]) // Added isVideoPlaying dependency

  // ✅ Initialize WhisperLive Client with Hybrid AEC
  useEffect(() => {
    console.log('🎤 WhisperLive Client Effect triggered:', { conversationMode, isStarted, webrtcReady })

    // Don't initialize until app is started
    if (!isStarted) {
      console.log('⏸️ Skipping WhisperLive client - app not started yet')
      return
    }

    // Only activate in continuous mode
    if (conversationMode !== 'continuous') {
      console.log('⏸️ Skipping WhisperLive client - not in continuous mode')

      // Clean up if switching out of continuous mode
      if (whisperLiveClientRef.current) {
        console.log('🔇 Stopping WhisperLive client (mode changed)')
        whisperLiveClientRef.current.disconnect()
        whisperLiveClientRef.current = null
      }
      return
    }

    // ✅ START when app is started and mode is continuous
    console.log('▶️ Initializing WhisperLive client...')
    console.log('ℹ️ Using WebSocket audio streaming with hybrid AEC (browser + server)')
    const serverUrl = import.meta.env.VITE_WHISPER_SERVER_URL || 'ws://localhost:9090'
    console.log('🌐 WhisperLive Server URL:', serverUrl)
    console.log('📋 Environment:', {
      VITE_WHISPER_SERVER_URL: import.meta.env.VITE_WHISPER_SERVER_URL,
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV
    })
    setWhisperLiveStatus('connecting') // Set status to connecting

    // Wrap in try-catch to prevent errors from blocking render
    try {
      const whisperClient = new WhisperLiveClient({
        serverUrl: import.meta.env.VITE_WHISPER_SERVER_URL || 'ws://localhost:9090',
        language: null,  // null = auto-detect language (faster, more accurate)
        onTranscript: (text, segments) => {
          console.log('📝 WhisperLive transcript:', text)
          handleVoiceInput(text)
        },
        onError: (error) => {
          console.error('❌ WhisperLive client error:', error)
          // Don't let errors block the UI
          setWhisperLiveStatus('error')
          
          // Show user-friendly error message
          if (error.name === 'NotAllowedError') {
            console.error('🚫 Microphone permission denied - user must allow mic access')
          } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Failed to fetch')) {
            console.warn('⚠️ WhisperLive server not available - will retry when server is ready')
            // Try to reconnect on network errors (non-blocking)
            setTimeout(() => {
              if (whisperLiveClientRef.current && !whisperLiveClientRef.current.isConnected) {
                console.log('🔄 Attempting to reconnect WhisperLive client...')
                whisperLiveClientRef.current.connect().catch(reconnectError => {
                  console.warn('⚠️ Reconnection failed (non-critical):', reconnectError.message)
                })
              }
            }, 5000) // Wait 5 seconds before retry
          }
        },
        onStatusChange: (status, data) => {
          console.log('📊 WhisperLive status:', status, data)
          if (status === 'ready') {
            console.log('🚀 WhisperLive ready for audio streaming')
            setWhisperLiveStatus('connected')
          } else if (status === 'waiting') {
            console.log(`⏳ Server full, waiting ${data} minutes`)
            setWhisperLiveStatus('waiting')
          }
        },
        onConnectionChange: (connected) => {
          console.log(`🔌 WhisperLive connection: ${connected ? 'connected' : 'disconnected'}`)
          setWhisperLiveStatus(connected ? 'connected' : 'disconnected')
        }
      })

      // Store client reference immediately (before connection)
      whisperLiveClientRef.current = whisperClient

      // Initialize and connect the WhisperLive client (non-blocking)
      whisperClient.connect().then(() => {
        console.log('✅ WhisperLive client connected - waiting for SERVER_READY before starting audio')
        // Don't start recording immediately - wait for SERVER_READY message
        // The server will send SERVER_READY after model is loaded and ready
        setWhisperLiveStatus('connected')
      }).catch(error => {
        // Non-blocking error - app should still render
        console.error('❌ WhisperLive client connection failed:', error)
        console.error('📋 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        console.error('🔧 To fix:')
        console.error('   1. Start WhisperLive server:')
        console.error('      cd WhisperLive')
        console.error('      source ../whisper_env/bin/activate')
        console.error('      python run_server.py --backend faster_whisper --port 9090')
        console.error('   2. Check server logs for connection attempts')
        console.error('   3. Verify WebSocket URL:', serverUrl)
        setWhisperLiveStatus('disconnected')
        // Don't throw - let the app continue rendering
      })

    } catch (error) {
      // Catch any synchronous errors during initialization
      console.error('❌ Error creating WhisperLive client (non-blocking):', error)
      setWhisperLiveStatus('error')
      // Don't throw - ensure React can still render
    }

    // Cleanup on unmount or mode change
    return () => {
      if (whisperLiveClientRef.current) {
        console.log('🧹 Cleaning up WhisperLive client')
        whisperLiveClientRef.current.disconnect()
        whisperLiveClientRef.current = null
      }
    }
  }, [conversationMode, selectedLanguage, isStarted]) // Added isStarted dependency

  // ✅ Sync Avatar Speaking State with WhisperLive Client
  useEffect(() => {
    if (whisperLiveClientRef.current) {
      // Note: The WhisperLive client handles AEC server-side
      // Browser AEC is always active during recording
      console.log(`🎭 Avatar speaking state: ${avatarSpeaking}`)
    }
  }, [avatarSpeaking])

  // ✅ Retry WhisperLive recording on user interaction (for microphone permission)
  useEffect(() => {
    if (conversationMode !== 'continuous' || !isStarted) return

    const handleUserClick = () => {
      // If WhisperLive is connected but not recording (likely permission issue), retry
      if (whisperLiveClientRef.current && 
          whisperLiveClientRef.current.isConnected && 
          !whisperLiveClientRef.current.isRecording &&
          whisperLiveClientRef.current.waitingForPermission) {
        console.log('🖱️ User clicked - retrying WhisperLive recording (microphone permission)...')
        whisperLiveClientRef.current.startRecording().catch(err => {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            console.warn('⚠️ Microphone permission still denied. Please check browser settings.')
          } else {
            console.error('❌ Failed to start recording on click:', err)
          }
        })
      }
    }

    // Add click listener to document
    document.addEventListener('click', handleUserClick, { once: false, passive: true })
    document.addEventListener('touchstart', handleUserClick, { once: false, passive: true })

    return () => {
      document.removeEventListener('click', handleUserClick)
      document.removeEventListener('touchstart', handleUserClick)
    }
  }, [conversationMode, isStarted])

  // Expose voice input handler globally for CompactControls
  useEffect(() => {
    window.handleVoiceInput = handleVoiceInput
    
    window.handleWakeWord = () => {
      console.log('👋 Wake word detected - activating mic AND switching to continuous mode')
      if (!isListening && !avatarSpeaking) {
        console.log('🎤 Starting main recognition after wake word')
        // Switch to continuous conversation mode after first wake word
        setConversationMode('continuous')
        console.log('🔄 SWITCHED TO CONTINUOUS CONVERSATION MODE (no more wake words needed!)')
        handleStartListening()
      } else {
        console.log('⚠️ Cannot start - already listening or avatar speaking')
      }
    }
    
    return () => {
      delete window.handleVoiceInput
      delete window.handleWakeWord
    }
  }, [userMessages, detectedPersona, isListening, avatarSpeaking]) // Re-create when dependencies change

  const handleStartListening = () => {
    // In continuous mode, WhisperLive is always-on, so don't change isListening state
    if (conversationMode === 'continuous') {
      console.log('ℹ️ Microphone is always-on in continuous mode (WhisperLive handles it)')
      
      // If WhisperLive is ready but recording hasn't started (permission issue),
      // try to start recording now (user interaction will allow it)
      if (whisperLiveClientRef.current && !whisperLiveClientRef.current.isRecording) {
        console.log('🔄 User interaction detected - attempting to start WhisperLive recording...')
        whisperLiveClientRef.current.startRecording().catch(err => {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            console.warn('⚠️ Microphone permission still denied. Check browser settings.')
          } else {
            console.error('❌ Failed to start recording:', err)
          }
        })
      }
      return
    }
    setIsListening(true)
    setTranscript('Listening...')
    handleUserActivity()
  }

  const handleStopListening = () => {
    // In continuous mode, WhisperLive is always-on, so don't stop it
    if (conversationMode === 'continuous') {
      console.log('ℹ️ Microphone stays always-on in continuous mode (WhisperLive handles it)')
      return
    }
    setIsListening(false)
    setTimeout(() => setTranscript(''), 2000) // Clear after 2s
  }

  // Start timeout system based on speech interaction only (not touch)
  // Timeout triggers after last voice interaction, not touch events
  useEffect(() => {
    const hasConversation = conversationHistory.length > 0
    const interactionInProgress = isListening || avatarSpeaking
    // Don't show timeout when video is playing
    const shouldMonitorInactivity = isStarted && hasConversation && !interactionInProgress && !isVideoPlaying

    if (!shouldMonitorInactivity) {
      if (showTimeout) {
        console.log('✅ Interaction resumed - hiding timeout warning')
      }
      setShowTimeout(false)
      return
    }

    const idleAnchor = Math.max(lastUserActivity, lastAvatarSpeechEnd)
    const elapsed = Date.now() - idleAnchor
    const remaining = Math.max(30000 - elapsed, 0)

    if (remaining === 0) {
      console.log('⚠️ 30 seconds of post-speech inactivity - showing timeout warning')
      setShowTimeout(true)
      return
    }

    console.log(`⏲️ Scheduling timeout warning in ${remaining}ms`)
    const timer = setTimeout(() => {
      console.log('⚠️ 30 seconds of post-speech inactivity - showing timeout warning')
      setShowTimeout(true)
    }, remaining)

    return () => {
      console.log('⏹️ Clearing timeout timer (activity detected)')
      clearTimeout(timer)
    }
  }, [
    isStarted,
    conversationHistory.length,
    isListening,
    avatarSpeaking,
    lastUserActivity,
    lastAvatarSpeechEnd,
    showTimeout,
    isVideoPlaying
  ])

  const handleUserActivity = () => {
    setLastUserActivity(Date.now())
    setShowTimeout(false)
  }

  const handleSessionTimeout = () => {
    console.log('🔄 Session timeout - resetting conversation (keeping session active)')
    
    // Clear AI service session
    clearSession()
    
    // Reset conversation state but keep the session active
    setConversationHistory([])
    setUserMessages([])
    setCurrentSlide(null)
    setDetectedPersona(null)
    setTranscript('')
    setIsListening(false)
    setShowTimeout(false)
    
    // Reset back to wake-word mode
    setConversationMode('wake-word')
    console.log('🔄 Reset to wake-word mode - say "Hey Mira" to start again')
    
    // Send welcome message again after a short delay (connection should already be established)
    setTimeout(() => {
      const welcomeMessage = "Welcome back! How may I assist you today?"
      
      setConversationHistory([
        {
          speaker: 'assistant',
          text: welcomeMessage,
          timestamp: new Date().toLocaleTimeString(),
          isAI: true
        }
      ])
      
      // Send welcome message to avatar (session should already exist)
      sendTextToAvatar(welcomeMessage).catch(err => {
        console.error('Failed to send welcome to avatar:', err)
      })
    }, 2000)
  }

  const handleCloseSlide = () => {
    console.log('❌ Closing slide/video - interrupting avatar speech')
    
    // Stop avatar from speaking
    interruptAvatar()
    
    // Close the slide and video
    setCurrentSlide(null)
    setVideoInfo(null)
    setIsVideoPlaying(false)
  }

  const handleVideoEnd = () => {
    console.log('✅ Video ended')
    setIsVideoPlaying(false)
    setVideoInfo(null)
    setCurrentSlide(null)
  }

  const handleVoiceInput = async (text) => {
    setTranscript(text)

    // Register user activity
    handleUserActivity()

    // Add user message to history
    setConversationHistory(prev => [
      ...prev,
      {
        speaker: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString()
      }
    ])

    // Track user messages for persona detection
    const updatedUserMessages = [...userMessages, text]
    setUserMessages(updatedUserMessages)

    // Analyze persona for AI service
    let currentPersona = detectedPersona
    if (shouldInferPersona(updatedUserMessages.length)) {
      const analysis = analyzePersona(updatedUserMessages)
      console.log('🎯 Persona Analysis:', analysis)

      if (analysis.confidence >= 0.6 && analysis.persona !== detectedPersona) {
        setDetectedPersona(analysis.persona)
        currentPersona = analysis.persona
        console.log(`✅ Persona detected: ${analysis.persona} (${(analysis.confidence * 100).toFixed(0)}% confidence)`)
      }
    }

      try {
        const lowerText = text.toLowerCase()
        
        // PRIORITY 0: Handle stop/close commands FIRST (when video or slide is showing)
        if (isVideoPlaying || currentSlide) {
          const isStopCommand = /stop|close|exit|end|finish|enough|that's all|cancel|you can stop|that's enough/i.test(text)
          
          if (isStopCommand) {
            console.log('🛑 Stop command detected - closing video/slide')
            handleCloseSlide()
            
            // Get chitchat response for stop command
            const ack = await getImmediateAcknowledgment(text)
            
            // Send the response (should be "Sure, I've closed that for you...")
            sendTextToAvatar(ack.acknowledgment).catch(err => {
              console.error('Failed to send stop confirmation:', err)
            })
            
            // Add to conversation history
            setTimeout(() => {
              setConversationHistory(prev => [
                ...prev,
                {
                  speaker: 'assistant',
                  text: ack.acknowledgment,
                  timestamp: new Date().toLocaleTimeString()
                }
              ])
            }, 500)
            
            return // Stop further processing
          }
        }
        
        // Check if user wants MORE DETAILS/SLIDES first (higher priority than video)
        const wantsDetails = /show me detail|tell me more|in detail|present|elaborate|explain more|show slides?/i.test(text)
        
        // Check if user wants to play video (must be explicit)
        // Only treat as video confirmation if NOT asking for details/slides
        const wantsVideo = !wantsDetails && (
          /yes.*video|play.*video|watch.*video|show.*video|play it|watch it|yes please|^yes$|^play$/i.test(text)
        )

      // If user confirmed video explicitly and we have pending video info, play it
      if (wantsVideo && videoInfo && !isVideoPlaying) {
        console.log('🎥 User confirmed video playback:', videoInfo.title)
        setCurrentSlide(null) // Clear any text content
        setIsVideoPlaying(true) // This will trigger video playback in ContentPanel
        setPendingVideoSuggestion(null) // Clear the pending suggestion
        // Interrupt avatar if speaking
        if (avatarSpeaking) {
          interruptAvatar()
        }
        // Don't send text to avatar - video will play
        return
      }
      
      // If user declined video, clear the suggestion
      const declinesVideo = lowerText.includes('no') || lowerText.includes('skip') || lowerText.includes('not now')
      if (declinesVideo && pendingVideoSuggestion) {
        console.log('🚫 User declined video suggestion')
        setPendingVideoSuggestion(null)
        setVideoInfo(null)
      }

      // PHASE 1: Immediate Acknowledgment (0ms perceived delay)
      const ack = await getImmediateAcknowledgment(text)

      // PHASE 2: Check if this is chitchat
      if (!ack.use_rag && ack.query_type === 'chitchat') {
        console.log('💬 Chitchat detected - using direct response')
        
        // Send chitchat response directly (no additional processing needed)
        sendTextToAvatar(ack.acknowledgment).catch(err => {
          console.error('Failed to send chitchat to avatar:', err)
        })
        
        // Add to conversation history
        setTimeout(() => {
          setConversationHistory(prev => [
            ...prev,
            {
              speaker: 'assistant',
              text: ack.acknowledgment,
              timestamp: new Date().toLocaleTimeString()
            }
          ])
        }, 500)
        
        return // Don't process further
      }

      // Send acknowledgment to avatar for knowledge queries
      sendTextToAvatar(ack.acknowledgment).catch(err => {
        console.error('Failed to send acknowledgment to avatar:', err)
      })

      // PHASE 3: Full Processing (only if knowledge query)
      if (ack.use_rag) {
        // Check if this is a "tell me more" query
        const isTellMeMore = /tell me more|more details|elaborate|explain more|in detail|show me details|present/i.test(text)
        
        // Detect intent for 100% accurate content generation
        const intent = detectIntent(text)

        // Get AI response with intent-based context
        const aiResult = await getAIResponse(text, currentPersona, intent)

        // Store video info if available
        if (aiResult.videoInfo) {
          setVideoInfo(aiResult.videoInfo)
          console.log('🎥 Video available for query:', aiResult.videoInfo.title)
        } else {
          setVideoInfo(null)
        }

        // Generate dynamic content with multiple fallback levels
        let content = null
        let ragContent = null
        let ragResult = null
        const userWantsSlide = wantsSlide(text)

        // Level 0: Try RAG service first (highest intelligence)
        try {
          console.log('🎯 Querying RAG service for dynamic content...')
          
          // Build context for RAG - include last topic if this is a "tell me more" query
          const ragContext = {
            user_id: 'kiosk_user',
            context: {
              conversation_history: conversationHistory.slice(-3),
              detected_persona: currentPersona,
              last_topic: isTellMeMore && lastTopicContext ? lastTopicContext : null
            }
          }
          
          ragResult = await queryRAGService(text, intent, ragContext)

          if (ragResult && ragResult.display_structure) {
            // Store topic context for future "tell me more" queries
            if (ragResult.analysis_metadata?.intent) {
              setLastTopicContext({
                intent: ragResult.analysis_metadata.intent,
                query: text,
                timestamp: Date.now()
              })
            }
            
            // Check for video suggestion
            if (ragResult.display_structure.video_suggestion) {
              console.log('🎥 Video suggestion received:', ragResult.display_structure.video_suggestion)
              setPendingVideoSuggestion(ragResult.display_structure.video_suggestion)
            }
            
            // Check if we should show slides (only when user explicitly wants details)
            const shouldShowSlide = ragResult.display_structure.wants_details === true
            
            if (shouldShowSlide) {
              // PRIORITY: Check if static slide_id exists
              const staticSlideId = ragResult.display_structure.slide_id
              
              if (staticSlideId) {
                // Use pre-built static slide from contentEngine
                console.log('📺 Using static slide:', staticSlideId)
                const staticSlide = getContentById(staticSlideId)
                
                if (staticSlide) {
                  ragContent = staticSlide
                  setCurrentSlide(staticSlide)
                  console.log('✅ Static slide loaded:', {
                    id: staticSlide.id,
                    title: staticSlide.title,
                    sections_count: staticSlide.sections?.length || 0
                  })
                } else {
                  console.warn('⚠️ Static slide not found for ID:', staticSlideId)
                  // Fallback to RAG-generated content
                  const convertedContent = convertRAGCardsToSections({
                    ...ragResult.display_structure,
                    rag_metadata: {
                      response_time_ms: ragResult.generation_time_ms,
                      cache_hit: ragResult.cache_hit,
                      retrieved_docs_count: ragResult.retrieved_docs.length,
                      analysis_confidence: ragResult.analysis_metadata.confidence || 0
                    }
                  });
                  
                  if (convertedContent) {
                    ragContent = convertedContent
                    setCurrentSlide(convertedContent)
                  }
                }
              } else {
                // No static slide - convert RAG content to sections format
                console.log('📝 No static slide - using RAG-generated content')
                const convertedContent = convertRAGCardsToSections({
                  ...ragResult.display_structure,
                  rag_metadata: {
                    response_time_ms: ragResult.generation_time_ms,
                    cache_hit: ragResult.cache_hit,
                    retrieved_docs_count: ragResult.retrieved_docs.length,
                    analysis_confidence: ragResult.analysis_metadata.confidence || 0
                  }
                });

                if (convertedContent) {
                  ragContent = convertedContent;
                  setCurrentSlide(ragContent);
                  console.log('✅ RAG content converted to sections format:', {
                    title: ragContent.title,
                    subtitle: ragContent.subtitle,
                    sections_count: ragContent.sections?.length || 0
                  });
                } else {
                  console.log('⚠️ RAG content conversion failed, keeping original format');
                  ragContent = {
                    ...ragResult.display_structure,
                    rag_metadata: {
                      response_time_ms: ragResult.generation_time_ms,
                      cache_hit: ragResult.cache_hit,
                      retrieved_docs_count: ragResult.retrieved_docs.length,
                      analysis_confidence: ragResult.analysis_metadata.confidence || 0
                    }
                  };
                  setCurrentSlide(ragContent);
                }
              }
            } else {
              console.log('💬 General query - no slides shown (verbal response only)')
              setCurrentSlide(null)
            }
            console.log('🎯 RAG service provided dynamic content')
            if (ragContent) {
              console.log('📊 Final RAG Content Structure:', {
                has_title: !!ragContent.title,
                has_subtitle: !!ragContent.subtitle,
                has_sections: !!ragContent.sections,
                sections_count: ragContent.sections?.length || 0,
                has_display_type: !!ragContent.display_type,
                has_cards: !!ragContent.cards,
                full_keys: Object.keys(ragContent),
                first_section_sample: ragContent.sections?.[0]
              })
              console.log('✅ setCurrentSlide called with RAG content - should trigger re-render')
            } else {
              console.log('✅ No slides needed - verbal response only')
            }
          } else {
            console.log('⚠️ RAG result missing display_structure:', !!ragResult)
          }
        } catch (ragError) {
          console.warn('⚠️ RAG service failed, falling back to legacy content generation:', ragError)
        }

        // ONLY use legacy content generation if RAG wasn't used or failed
        if (!ragResult) {
          // Level 1: Exact intent match (highest accuracy)
          if (!ragContent && intent.type) {
            content = await generateDynamicContent(text, intent)
            if (content) {
              setCurrentSlide(content)
              console.log('📊 Level 1 - 100% accurate dynamic content:', content.title)
            }
          }

          // Level 2: Detailed query that wants slides (even without specific intent)
          if (!ragContent && !content && userWantsSlide) {
            console.log('🔍 Level 2 - Detailed query detected, trying dynamic content generation')
            content = await generateDynamicContent(text) // Try without specific intent
            if (content) {
              setCurrentSlide(content)
              console.log('📊 Level 2 - Dynamic content found for detailed query:', content.title)
            }
          }

          // Level 3: Fallback to static content for slide requests
          if (!ragContent && !content && userWantsSlide) {
            console.log('📋 Level 3 - Using static content for slide request')
            content = getContentForQuery(text)
            setCurrentSlide(content)
            console.log('📊 Level 3 - Static content:', content.title)
          }
        } else {
          console.log('✅ RAG handled query - skipping legacy content generation')
        }

        // Final slide state is already set by RAG or legacy generation above
        // No additional logic needed here
        console.log('🔍 Final slide state:', {
          hasSlide: !!currentSlide,
          slideTitle: currentSlide?.title,
          ragUsed: !!ragResult,
          ragContentShown: !!ragContent
        })

        // Send full response to avatar (only if not playing video)
        // Also check if we're about to play a video - if so, don't send the response
        const willPlayVideo = wantsVideo && aiResult.videoInfo
        if (!isVideoPlaying && !willPlayVideo) {
          let avatarMessage = aiResult.response
          
          // If there's a pending video suggestion, ask user if they want to watch it
          if (pendingVideoSuggestion && !willPlayVideo) {
            avatarMessage += `\n\nWould you like to watch a video about "${pendingVideoSuggestion.title}"? Just say yes if you'd like to see it.`
            
            // Store video info so it can be played if user confirms
            setVideoInfo({
              videoId: extractVideoId(pendingVideoSuggestion.url),
              title: pendingVideoSuggestion.title,
              description: pendingVideoSuggestion.description || ''
            })
          }
          
          sendTextToAvatar(avatarMessage).catch(err => {
            console.error('Failed to send to avatar:', err)
          })
        } else if (willPlayVideo) {
          console.log('🔇 Skipping avatar speech - video will play')
        }

        // Add AI response to history
        setTimeout(() => {
          setConversationHistory(prev => [
            ...prev,
            {
              speaker: 'assistant',
              text: aiResult.response,
              timestamp: new Date().toLocaleTimeString(),
              isAI: true
            }
          ])
        }, 500)
      }

    } catch (error) {
      console.error('AI Response Error:', error)

      // On error: No fallback content, just error message
      const errorMessage = "I'm having trouble processing that right now. Could you please try again?"
      sendTextToAvatar(errorMessage).catch(err => {
        console.error('Failed to send error to avatar:', err)
      })

      setCurrentSlide(null)

      setTimeout(() => {
        setConversationHistory(prev => [
          ...prev,
          {
            speaker: 'assistant',
            text: errorMessage,
            timestamp: new Date().toLocaleTimeString()
          }
        ])
      }, 500)
    }
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const toggleConversationMode = () => {
    setConversationMode(prev => {
      const newMode = prev === 'wake-word' ? 'continuous' : 'wake-word'
      console.log(`🔄 Conversation mode switched to: ${newMode}`)
      return newMode
    })
  }

  // Debug function to check mic status
  const checkMicStatus = () => {
    console.log('🔍 Mic Status Check:', {
      conversationMode,
      isStarted,
      webrtcReady,
      hasContinuousMic: !!continuousMicRef.current,
      micRunning: continuousMicRef.current?.isRunning?.() || false,
      avatarSpeaking,
      isListening
    })

    if (continuousMicRef.current) {
      console.log('🎤 Continuous Mic Details:', {
        isActive: continuousMicRef.current.isActive,
        avatarSpeaking: continuousMicRef.current.avatarSpeaking,
        lastProcessedTime: continuousMicRef.current.lastProcessedTime
      })
    }
  }

  // Add to window for debugging
  if (typeof window !== 'undefined') {
    window.checkMicStatus = () => {
      const client = whisperLiveClientRef.current
      console.log('🔍 WhisperLive Client Status:', {
        conversationMode,
        isStarted,
        webrtcReady,
        hasClient: !!client,
        clientStatus: client ? client.getStatus() : null,
        avatarSpeaking,
        isListening
      })
    }
    window.forceStartMic = () => {
      if (whisperLiveClientRef.current) {
        console.log('🔧 Force restarting WhisperLive client...')
        whisperLiveClientRef.current.disconnect()
        setTimeout(() => {
          const newClient = new WhisperLiveClient({
            serverUrl: import.meta.env.VITE_WHISPER_SERVER_URL || 'ws://localhost:9090',
            language: null,  // null = auto-detect language (faster, more accurate)
            onTranscript: (text) => handleVoiceInput(text),
            onError: (error) => console.error('❌ Force restart error:', error),
            onConnectionChange: (connected) => {
              console.log(`🔌 Force restart connection: ${connected}`)
            }
          })
          newClient.connect().then(() => newClient.startRecording()).then(() => {
            whisperLiveClientRef.current = newClient
            console.log('✅ WhisperLive client force restarted')
          })
        }, 1000)
      } else {
        console.log('❌ No WhisperLive client instance')
      }
    }
    window.forceStopMic = () => {
      if (whisperLiveClientRef.current) {
        console.log('🔧 Force stopping WhisperLive client...')
        whisperLiveClientRef.current.disconnect()
        whisperLiveClientRef.current = null
      } else {
        console.log('❌ No WhisperLive client instance')
      }
    }
  }

  return (
    <div className={`app ${theme}`}>
      {/* Welcome Screen */}
      <AnimatePresence>
        {showWelcomeScreen && (
          <WelcomeScreen onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>

      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
          colors={['#0066cc', '#4fc3f7', '#8e44ad', '#e74c3c', '#f39c12']}
        />
      )}

      <KioskHeader
        connectionStatus={connectionStatus}
        whisperLiveStatus={whisperLiveStatus}
        theme={theme}
        onThemeToggle={toggleTheme}
        conversationMode={conversationMode}
        onModeToggle={toggleConversationMode}
      />

      <div className={`kiosk-main ${(currentSlide && !isVideoPlaying) || (videoInfo && isVideoPlaying) ? 'content-active' : ''}`}>
        {/* Content Panel - Full screen when active */}
        <ContentPanel
          currentSlide={currentSlide}
          isStarted={isStarted}
          onClose={handleCloseSlide}
          videoInfo={videoInfo}
          isVideoPlaying={isVideoPlaying}
          onVideoEnd={handleVideoEnd}
        />

        {/* Avatar Panel - Full screen by default, hidden when content active */}
        <AvatarPanel
          isStarted={isStarted}
          onStart={handleStart}
          isListening={isListening}
        />

        {/* Avatar Overlay - Circular, top-right when content active */}
        <AvatarOverlay
          isStarted={isStarted}
          active={!!(currentSlide || videoInfo)}
        />
      </div>

      {/* Bottom Compact Controls */}
      <CompactControls
        isListening={isListening}
        transcript={transcript}
        onStartListening={handleStartListening}
        onStopListening={handleStopListening}
        isStarted={isStarted}
        avatarSpeaking={avatarSpeaking}
        conversationMode={conversationMode}
      />

      {/* Timeout Manager */}
      <TimeoutManager
        isActive={showTimeout && !isVideoPlaying}
        onTimeout={handleSessionTimeout}
        onUserActivity={handleUserActivity}
        isListening={isListening}
        avatarSpeaking={avatarSpeaking}
      />

      {/* Conversation History Panel */}
      <ConversationHistoryPanel
        history={conversationHistory.reduce((acc, item, idx) => {
          if (item.speaker === 'user') {
            acc.push({
              user: item.text,
              avatar: conversationHistory[idx + 1]?.speaker === 'assistant' ? conversationHistory[idx + 1].text : null,
              timestamp: item.timestamp || Date.now()
            })
          }
          return acc
        }, [])}
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
      />

      {/* Microphone Test Panel */}
      {showMicrophoneTest && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
            <MicrophoneTest />
            <button
              onClick={() => setShowMicrophoneTest(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                padding: '8px 16px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* History Icon Button - Fixed position */}
      {isStarted && (
        <motion.button
          className="history-icon-button"
          onClick={() => setShowHistoryPanel(true)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="View Conversation History"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {conversationHistory.length > 0 && (
            <span className="history-badge">{conversationHistory.length}</span>
          )}
        </motion.button>
      )}

      {/* Microphone Test Button - Fixed position */}
      {isStarted && (
        <motion.button
          className="mic-test-icon-button"
          onClick={() => setShowMicrophoneTest(true)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Test Microphone"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '120px', // Position next to history button
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            zIndex: 100
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </motion.button>
      )}

      <AnimatePresence>
        {showLanguageSelector && (
          <LanguageSelector
            onSelect={handleLanguageSelect}
            onClose={() => setShowLanguageSelector(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
