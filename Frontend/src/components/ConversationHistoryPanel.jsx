import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, User, Bot } from 'lucide-react'
import './ConversationHistoryPanel.css'

const ConversationHistoryPanel = ({ history, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="history-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="history-header">
              <div className="history-title">
                <MessageCircle size={24} />
                <h2>Conversation History</h2>
              </div>
              <button className="history-close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            
            {/* Content */}
            <div className="history-content">
              {history.length === 0 ? (
                <div className="history-empty">
                  <MessageCircle size={48} className="empty-icon" />
                  <p>No conversation yet</p>
                  <span>Start by saying "Hello" or asking a question</span>
                </div>
              ) : (
                <div className="history-messages">
                  {history.map((item, index) => (
                    <div key={index} className="history-message-group">
                      {/* User Message */}
                      <div className="history-message user-message">
                        <div className="message-avatar">
                          <User size={20} />
                        </div>
                        <div className="message-content">
                          <div className="message-header">
                            <span className="message-label">You</span>
                            <span className="message-time">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="message-text">{item.user}</div>
                        </div>
                      </div>
                      
                      {/* Avatar Response */}
                      {item.avatar && (
                        <div className="history-message avatar-message">
                          <div className="message-avatar">
                            <Bot size={20} />
                          </div>
                          <div className="message-content">
                            <div className="message-header">
                              <span className="message-label">Avatar</span>
                            </div>
                            <div className="message-text">{item.avatar}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ConversationHistoryPanel


