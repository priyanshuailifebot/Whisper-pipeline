import { motion } from 'framer-motion'
import { Sun, Moon, Wifi, WifiOff, Mic, Radio } from 'lucide-react'
import nassicomLogo from '../assets/nasscom-coe.jpeg'
import dstLogo from '../assets/Dst.jpeg'
import aiCoeLogo from '../assets/AI-coe.jpeg'
import gilLogo from '../assets/GiL.jpeg'
import microsoftLogo from '../assets/Microsoft_logo_(2012).svg.png'
import './KioskHeader.css'

const KioskHeader = ({ connectionStatus, theme, onThemeToggle, onVoiceTestMode, whisperLiveStatus }) => {
  // Avatar connection status (WebRTC)
  const avatarStatus = connectionStatus === 'connected' ? 'Avatar Connected' : 
                       connectionStatus === 'connecting' ? 'Connecting Avatar...' : 'Avatar Disconnected'
  
  const AvatarStatusIcon = connectionStatus === 'disconnected' ? WifiOff : Wifi
  const avatarStatusColor = connectionStatus === 'connected' ? '#10b981' : 
                            connectionStatus === 'connecting' ? '#f59e0b' : '#6b7280' // Gray when disconnected (non-critical)
  
  // WhisperLive connection status
  const whisperStatus = whisperLiveStatus === 'connected' ? 'WhisperLive Ready' :
                        whisperLiveStatus === 'connecting' ? 'Connecting WhisperLive...' :
                        whisperLiveStatus === 'error' ? 'WhisperLive Error' :
                        'WhisperLive Disconnected'
  
  const WhisperStatusIcon = whisperLiveStatus === 'connected' ? Radio : WifiOff
  const whisperStatusColor = whisperLiveStatus === 'connected' ? '#10b981' :
                             whisperLiveStatus === 'connecting' ? '#f59e0b' :
                             whisperLiveStatus === 'error' ? '#ef4444' : '#6b7280'

  return (
    <motion.header 
      className="kiosk-header"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-content">
        {/* Top Section - Partner Logos */}
        <div className="header-top-logos">
          <div className="logo-item">
            <img src={dstLogo} alt="DST - Department of Science & Technology" />
          </div>
          <div className="logo-item logo-center">
            <img src={aiCoeLogo} alt="AI Centre of Excellence" />
          </div>
          <div className="logo-item">
            <img src={gilLogo} alt="Gujarat Informatics Ltd." />
          </div>
        </div>

        {/* Bottom Section - Supported By & Controls */}
        <div className="header-bottom-section">
          <div className="supported-by-container">
            <span className="supported-by-text">Supported by</span>
            <div className="supported-logos">
              <div className="supported-logo">
                <img src={nassicomLogo} alt="NASSCOM CoE" />
              </div>
              <div className="supported-logo">
                <img src={microsoftLogo} alt="Microsoft" />
              </div>
            </div>
          </div>

          {/* Status & Theme Controls */}
          <div className="header-actions">
            {/* WhisperLive Status (Primary - for transcription) */}
            <div className="status-badge" style={{ '--status-color': whisperStatusColor }} title={whisperStatus}>
              <WhisperStatusIcon size={16} />
              <span>{whisperStatus}</span>
            </div>

            {/* Avatar Status (Secondary - for video avatar) */}
            <div className="status-badge" style={{ '--status-color': avatarStatusColor }} title={avatarStatus}>
              <AvatarStatusIcon size={16} />
              <span>{avatarStatus}</span>
            </div>

            {onVoiceTestMode && (
              <button className="voice-test-toggle" onClick={onVoiceTestMode} aria-label="Voice Test Mode">
                <Mic size={20} />
              </button>
            )}

            <button className="theme-toggle" onClick={onThemeToggle} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default KioskHeader

