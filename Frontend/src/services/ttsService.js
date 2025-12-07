/**
 * Azure Text-to-Speech Service
 * Uses Microsoft Azure Cognitive Services Speech SDK for voice synthesis
 */

import * as sdk from 'microsoft-cognitiveservices-speech-sdk'

// Azure Speech configuration from environment variables
// IMPORTANT: Never commit API keys! Use .env file with VITE_AZURE_SPEECH_KEY
const AZURE_SPEECH_CONFIG = {
  apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY || '',
  region: import.meta.env.VITE_AZURE_SPEECH_REGION || 'centralindia'
}

// Validate that API key is provided
if (!AZURE_SPEECH_CONFIG.apiKey) {
  console.warn('⚠️ VITE_AZURE_SPEECH_KEY not set. TTS will not work. Create .env file with your Azure Speech key.')
}

// Voice configurations for different languages
const VOICE_CONFIGS = {
  en: {
    voice: 'en-IN-PrabhatNeural', // Indian English male voice
    style: 'friendly',
    rate: '0%', // Normal speed
    pitch: '0%' // Normal pitch
  },
  hi: {
    voice: 'hi-IN-MadhurNeural', // Indian Hindi male voice
    style: 'cheerful',
    rate: '-10%', // Slightly slower for better clarity
    pitch: '0%'
  }
}

// Global speech synthesizer instance
let synthesizer = null
let currentLanguage = 'en'

/**
 * Initialize Azure Speech Synthesizer
 */
function initializeSynthesizer(language = 'en') {
  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      AZURE_SPEECH_CONFIG.apiKey,
      AZURE_SPEECH_CONFIG.region
    )

    // Configure voice based on language
    const voiceConfig = VOICE_CONFIGS[language] || VOICE_CONFIGS.en
    speechConfig.speechSynthesisVoiceName = voiceConfig.voice

    // Create synthesizer with default audio output (speakers)
    synthesizer = new sdk.SpeechSynthesizer(speechConfig, null)

    currentLanguage = language
    console.log(`🎤 Azure TTS initialized with ${voiceConfig.voice} (${language})`)

    return synthesizer
  } catch (error) {
    console.error('❌ Failed to initialize Azure TTS:', error)
    throw error
  }
}

/**
 * Detect language for TTS (similar to avatarStream.js logic)
 */
function detectTTSLanguage(text) {
  // Check for Devanagari script
  const containsHindiChars = /[\u0900-\u097F]/.test(text)
  const containsGujaratiChars = /[\u0A80-\u0AFF]/.test(text)

  // Check for Romanized Hindi words
  const romanizedHindiWords = [
    /\bmujhe\b/i, /\bkuchh?\b/i, /\bkaisa\b/i, /\bhai\b/i, /\bho\b/i,
    /\brah[aei]\b/i, /\bkar[oen]\b/i, /\bki[ya]?\b/i, /\bka\b/i, /\bke\b/i,
    /\bko\b/i, /\bse\b/i, /\bme\b/i, /\bpar\b/i, /\bhain\b/i, /\bhu\b/i,
    /\bhum\b/i, /\btum\b/i, /\btu\b/i, /\byeh\b/i, /\bwoh\b/i,
    /\bkaha[nt]?\b/i, /\bkya\b/i, /\bkyon\b/i, /\bkab\b/i, /\bkaise\b/i,
    /\bkitn[aei]\b/i, /\bchahiy[ae]\b/i, /\bdijiy[ae]\b/i, /\bla[ao]\b/i,
    /\bja[ao]\b/i, /\bdekh[no]\b/i, /\bsun[no]\b/i, /\bbata[no]\b/i,
    /\bsamajh[no]\b/i, /\bkar[no]\b/i, /\bmat\b/i, /\bna\b/i, /\bnhi\b/i,
    /\bhog[aei]\b/i, /\bth[aei]\b/i
  ]

  const containsRomanizedHindiWords = romanizedHindiWords.some(pattern =>
    pattern.test(text.toLowerCase())
  )

  // If text contains Hindi/Gujarati characters or Romanized Hindi words, use Hindi
  if (containsHindiChars || containsGujaratiChars || containsRomanizedHindiWords) {
    return 'hi'
  }

  return 'en'
}

/**
 * Sanitize text for speech synthesis (similar to avatarStream.js)
 */
function sanitizeForSpeech(text) {
  if (!text) return ''

  let cleaned = text

  // Remove markdown bold/italic
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1') // **text** -> text
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')     // *text* -> text
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1')     // __text__ -> text
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1')       // _text_ -> text

  // Remove markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')       // ### Header -> Header

  // Remove bullet points and list markers
  cleaned = cleaned.replace(/^[\s]*[-*•]\s+/gm, '')   // - item -> item
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '')        // 1. item -> item

  // Remove emojis
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & Pictographs
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & Map
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
  cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
  cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A

  // Remove other markdown syntax
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')       // `code` -> code
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text

  // Replace "CoE" with "COE" for proper pronunciation
  cleaned = cleaned.replace(/\bCoE\b/g, 'COE')

  // Replace rupee symbol with word
  cleaned = cleaned.replace(/₹(\d+)/g, '$1 rupees')   // ₹25 -> 25 rupees
  cleaned = cleaned.replace(/₹/g, 'rupees')           // ₹ -> rupees

  // Replace common abbreviations for better speech
  cleaned = cleaned.replace(/\bGovt\./g, 'Government')
  cleaned = cleaned.replace(/\bHon'ble\b/g, 'Honourable')
  cleaned = cleaned.replace(/\bMoU\b/g, 'M O U')
  cleaned = cleaned.replace(/\bMSMEs\b/g, 'M S M Es')
  cleaned = cleaned.replace(/\bAI\b/g, 'A I')
  cleaned = cleaned.replace(/\bIoT\b/g, 'I o T')
  cleaned = cleaned.replace(/\bGTM\b/g, 'Go To Market')
  cleaned = cleaned.replace(/\bIP\b/g, 'Intellectual Property')
  cleaned = cleaned.replace(/&/g, 'and') // Replace & with "and" for speech

  // Remove extra whitespace and newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')        // Max 2 newlines
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ')        // Single spaces only
  cleaned = cleaned.trim()

  return cleaned
}

/**
 * Escape XML characters for SSML
 * @param {string} text - Text to escape
 * @returns {string} XML-escaped text
 */
function escapeXmlForSsml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Speak text using Azure TTS
 * @param {string} text - Text to speak
 * @param {string} language - Language code ('en' or 'hi'), auto-detect if not provided
 * @returns {Promise<void>}
 */
export async function speakText(text, language = null) {
  return new Promise((resolve, reject) => {
    try {
      // Sanitize text
      const cleanText = sanitizeForSpeech(text)
      if (!cleanText) {
        console.warn('⚠️ No text to speak after sanitization')
        resolve()
        return
      }

      // Detect language if not provided
      const detectedLanguage = language || detectTTSLanguage(cleanText)

      console.log('🗣️ Azure TTS - Original text:', text)
      console.log('🧹 Sanitized text:', cleanText)
      console.log('🌐 Detected language:', detectedLanguage)

      // Initialize synthesizer if needed or language changed
      if (!synthesizer || currentLanguage !== detectedLanguage) {
        if (synthesizer) {
          synthesizer.close()
        }
        synthesizer = initializeSynthesizer(detectedLanguage)
      }

      // Create SSML for better speech control
      const voiceConfig = VOICE_CONFIGS[detectedLanguage] || VOICE_CONFIGS.en
      const escapedText = escapeXmlForSsml(cleanText)
      const ssml = `<speak version='1.0' xml:lang='${detectedLanguage}-IN'>
        <voice name='${voiceConfig.voice}'>
          <prosody rate='${voiceConfig.rate}' pitch='${voiceConfig.pitch}' style='${voiceConfig.style}'>
            ${escapedText}
          </prosody>
        </voice>
      </speak>`

      console.log('📤 Sending to Azure TTS:', { language: detectedLanguage, voice: voiceConfig.voice })

      // Speak the text
      synthesizer.speakSsmlAsync(
        ssml,
        result => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            console.log('✅ Azure TTS completed successfully')
            resolve()
          } else {
            console.error('❌ Azure TTS failed:', result.errorDetails)
            reject(new Error(result.errorDetails))
          }
        },
        error => {
          console.error('❌ Azure TTS error:', error)
          reject(error)
        }
      )

    } catch (error) {
      console.error('❌ Azure TTS exception:', error)
      reject(error)
    }
  })
}

/**
 * Stop current speech synthesis
 */
export function stopSpeech() {
  if (synthesizer) {
    try {
      synthesizer.close()
      synthesizer = null
      console.log('⏹️ Azure TTS stopped')
    } catch (error) {
      console.error('❌ Error stopping Azure TTS:', error)
    }
  }
}

/**
 * Check if TTS is currently speaking
 * @returns {boolean}
 */
export function isSpeaking() {
  // Azure SDK doesn't provide a direct way to check if speaking
  // We'll track this with events in the component
  return false
}

/**
 * Get available voices (for future use)
 */
export function getAvailableVoices() {
  return VOICE_CONFIGS
}

/**
 * Cleanup synthesizer resources
 */
export function cleanup() {
  if (synthesizer) {
    synthesizer.close()
    synthesizer = null
    console.log('🧹 Azure TTS cleaned up')
  }
}

export default {
  speakText,
  stopSpeech,
  isSpeaking,
  getAvailableVoices,
  cleanup,
  detectTTSLanguage,
  sanitizeForSpeech,
  escapeXmlForSsml
}
