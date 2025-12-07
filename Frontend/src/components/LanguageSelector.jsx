import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import './LanguageSelector.css'

const LanguageSelector = ({ onSelect, onClose }) => {
  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      nativeName: 'English',
      icon: '🇬🇧'
    },
    { 
      code: 'hi', 
      name: 'Hindi', 
      nativeName: 'हिंदी',
      icon: '🇮🇳'
    },
    { 
      code: 'gu', 
      name: 'Gujarati', 
      nativeName: 'ગુજરાતી',
      icon: '🇮🇳'
    }
  ]

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="language-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Language Selector */}
      <motion.div
        className="language-selector"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Header */}
        <div className="selector-header">
          <Globe className="selector-icon" size={32} />
          <h2 className="selector-title">Choose Your Language</h2>
          <p className="selector-subtitle">Select your preferred language to continue</p>
        </div>

        {/* Language Options */}
        <div className="language-options">
          {languages.map((lang, index) => (
            <motion.button
              key={lang.code}
              className="language-option"
              onClick={() => onSelect(lang.code)}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.03,
                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)'
              }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="language-icon">{lang.icon}</span>
              <div className="language-info">
                <div className="language-name">{lang.name}</div>
                <div className="language-native">{lang.nativeName}</div>
              </div>
              <div className="language-arrow">→</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </>
  )
}

export default LanguageSelector




