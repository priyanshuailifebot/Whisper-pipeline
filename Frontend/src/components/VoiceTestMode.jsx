import { useState, useRef, useEffect } from 'react'
import { getAIResponse } from '../services/aiService'
import { speakText, stopSpeech, cleanup as cleanupTTS } from '../services/ttsService'
import { MicrophoneIcon, SpeakerWaveIcon, StopIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'
import './VoiceTestMode.css'

function VoiceTestMode({ onExit }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Mira, your AI assistant at Nasscom Centre of Excellence. How can I help you test the audio response?",
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString(),
      isAI: true
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-IN' // Indian English

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        console.log('🎤 Voice recognition started')
      }

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        console.log('📝 Voice transcript:', transcript)
        handleSendMessage(transcript)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        console.log('🎤 Voice recognition ended')
      }

      recognitionRef.current.onerror = (event) => {
        console.error('❌ Voice recognition error:', event.error)
        setIsListening(false)
      }
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      cleanupTTS()
    }
  }, [])

  const handleSendMessage = async (text) => {
    if (!text.trim()) return

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      isAI: false
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsProcessing(true)

    try {
      // Get AI response
      const aiResult = await getAIResponse(text)

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResult.response,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        isAI: true
      }

      setMessages(prev => [...prev, aiMessage])

      // Speak the AI response
      setIsSpeaking(true)
      await speakText(aiResult.response)
      setIsSpeaking(false)

    } catch (error) {
      console.error('Error processing message:', error)

      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        isAI: true
      }

      setMessages(prev => [...prev, errorMessage])

      // Speak error message
      setIsSpeaking(true)
      await speakText(errorMessage.text)
      setIsSpeaking(false)
    }

    setIsProcessing(false)
  }

  const handleTextSubmit = (e) => {
    e.preventDefault()
    handleSendMessage(inputText)
  }

  const handleVoiceStart = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting voice recognition:', error)
      }
    }
  }

  const handleVoiceStop = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const handleStopSpeaking = () => {
    stopSpeech()
    setIsSpeaking(false)
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        text: "Chat cleared. How can I help you test the audio response?",
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        isAI: true
      }
    ])
  }

  return (
    <div className="voice-test-mode">
      {/* Header */}
      <div className="voice-test-header">
        <button
          onClick={onExit}
          className="exit-button"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Exit Voice Test
        </button>
        <h1 className="test-title">Azure TTS Voice Test Mode</h1>
        <div className="status-indicators">
          <div className={`status-indicator ${isListening ? 'active' : ''}`}>
            <MicrophoneIcon className="w-4 h-4" />
            Listening
          </div>
          <div className={`status-indicator ${isSpeaking ? 'active' : ''}`}>
            <SpeakerWaveIcon className="w-4 h-4" />
            Speaking
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <span className="message-timestamp">{message.timestamp}</span>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="message assistant-message processing">
            <div className="message-content">
              <p>Processing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Controls */}
      <div className="input-controls">
        <form onSubmit={handleTextSubmit} className="text-input-form">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message or use voice..."
            disabled={isProcessing}
            className="text-input"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="send-button"
          >
            Send
          </button>
        </form>

        <div className="voice-controls">
          {!isListening ? (
            <button
              onClick={handleVoiceStart}
              disabled={isSpeaking || isProcessing}
              className="voice-button start"
            >
              <MicrophoneIcon className="w-5 h-5 mr-2" />
              Start Voice
            </button>
          ) : (
            <button
              onClick={handleVoiceStop}
              className="voice-button stop"
            >
              <StopIcon className="w-5 h-5 mr-2" />
              Stop Voice
            </button>
          )}

          {isSpeaking && (
            <button
              onClick={handleStopSpeaking}
              className="voice-button stop-speaking"
            >
              <StopIcon className="w-5 h-5 mr-2" />
              Stop Speaking
            </button>
          )}

          <button
            onClick={handleClearChat}
            disabled={isProcessing}
            className="clear-button"
          >
            Clear Chat
          </button>
        </div>
      </div>

    </div>
  )
}

export default VoiceTestMode
