import React, { useState, useRef } from 'react'

export default function MicrophoneTest() {
  const [micStatus, setMicStatus] = useState('unknown') // unknown, granted, denied, error
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [logs, setLogs] = useState([])
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testMicrophoneAccess = async () => {
    try {
      addLog('🔍 Testing microphone access...')
      setMicStatus('testing')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      })

      streamRef.current = stream
      addLog('✅ Microphone access granted!')
      addLog(`🎤 Audio tracks: ${stream.getAudioTracks().length}`)
      addLog(`📊 Track settings: ${JSON.stringify(stream.getAudioTracks()[0].getSettings(), null, 2)}`)

      setMicStatus('granted')

      // Test recording capability
      try {
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        addLog('✅ MediaRecorder supported')
      } catch (recorderError) {
        addLog(`⚠️ MediaRecorder not supported: ${recorderError.message}`)
      }

    } catch (error) {
      addLog(`❌ Microphone access failed: ${error.name} - ${error.message}`)
      setMicStatus('denied')
    }
  }

  const startRecording = async () => {
    if (!streamRef.current) {
      addLog('❌ No microphone stream available')
      return
    }

    try {
      const chunks = []
      const mediaRecorder = new MediaRecorder(streamRef.current)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        addLog(`✅ Recording complete: ${blob.size} bytes`)
        setIsRecording(false)
      }

      mediaRecorder.start()
      setIsRecording(true)
      addLog('🎙️ Recording started...')

      // Stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 3000)

    } catch (error) {
      addLog(`❌ Recording failed: ${error.message}`)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      addLog('🛑 Recording stopped manually')
    }
  }

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      addLog('🧹 Microphone stream cleaned up')
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setAudioBlob(null)
    setMicStatus('unknown')
  }

  const testSpeechRecognition = () => {
    addLog('🎤 Testing Speech Recognition API...')

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addLog('❌ Speech Recognition API not supported')
      return
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => addLog('🎤 Speech recognition started')
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        addLog(`📝 Recognized: "${transcript}"`)
      }
      recognition.onerror = (event) => addLog(`❌ Speech recognition error: ${event.error}`)
      recognition.onend = () => addLog('🎤 Speech recognition ended')

      recognition.start()
      addLog('🚀 Speech recognition initiated')

    } catch (error) {
      addLog(`❌ Speech recognition setup failed: ${error.message}`)
    }
  }

  const getDeviceInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      speechRecognition: !!((window.SpeechRecognition || window.webkitSpeechRecognition)),
      mediaRecorder: !!window.MediaRecorder
    }

    addLog(`📱 Device Info: ${JSON.stringify(info, null, 2)}`)
  }

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #ccc',
      borderRadius: '10px',
      backgroundColor: '#f9f9f9',
      margin: '20px',
      fontFamily: 'monospace'
    }}>
      <h3>🎤 Microphone Diagnostic Test</h3>

      <div style={{ marginBottom: '20px' }}>
        <strong>Microphone Status:</strong>
        <span style={{
          color: micStatus === 'granted' ? 'green' :
                 micStatus === 'denied' ? 'red' :
                 micStatus === 'testing' ? 'orange' : 'gray',
          marginLeft: '10px'
        }}>
          {micStatus === 'unknown' ? 'Not tested' :
           micStatus === 'granted' ? '✅ Access granted' :
           micStatus === 'denied' ? '❌ Access denied' :
           micStatus === 'testing' ? '🔍 Testing...' :
           'Unknown'}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={getDeviceInfo} style={{ marginRight: '10px', padding: '8px 16px' }}>
          📱 Get Device Info
        </button>

        <button onClick={testMicrophoneAccess} style={{ marginRight: '10px', padding: '8px 16px' }}>
          🎤 Test Microphone Access
        </button>

        <button onClick={testSpeechRecognition} style={{ marginRight: '10px', padding: '8px 16px' }}>
          🗣️ Test Speech Recognition
        </button>

        {!isRecording ? (
          <button onClick={startRecording} disabled={micStatus !== 'granted'} style={{ marginRight: '10px', padding: '8px 16px' }}>
            🎙️ Record 3s Test
          </button>
        ) : (
          <button onClick={stopRecording} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: 'red', color: 'white' }}>
            🛑 Stop Recording
          </button>
        )}

        <button onClick={cleanup} style={{ padding: '8px 16px' }}>
          🧹 Cleanup
        </button>
      </div>

      {audioUrl && (
        <div style={{ marginBottom: '20px' }}>
          <strong>Recorded Audio:</strong>
          <audio controls src={audioUrl} style={{ marginLeft: '10px' }} />
        </div>
      )}

      <div style={{
        border: '1px solid #ddd',
        padding: '10px',
        height: '200px',
        overflowY: 'auto',
        backgroundColor: 'white'
      }}>
        <strong>Test Logs:</strong>
        {logs.length === 0 ? (
          <div style={{ color: '#999', fontStyle: 'italic' }}>No logs yet. Click buttons above to test.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ margin: '2px 0', fontSize: '12px' }}>{log}</div>
          ))
        )}
      </div>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <strong>Troubleshooting:</strong>
        <ul>
          <li>If "Microphone access denied", check browser permissions</li>
          <li>If "Speech Recognition not supported", the Web Speech API isn't available</li>
          <li>If recording works but speech recognition doesn't, the issue is with the Speech API specifically</li>
          <li>Try in different browsers (Chrome, Firefox, Edge) to compare</li>
        </ul>
      </div>
    </div>
  )
}
