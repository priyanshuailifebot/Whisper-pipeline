/**
 * API Service for Modern Kiosk UI
 * Handles communication with MuseTalk backend and avatar service
 */

class APIService {
  constructor() {
    // API Endpoints - will be proxied by Vite
    this.endpoints = {
      human: '/human',
      isSpeaking: '/is_speaking',
      museTalk: '/api/generate_video',
      health: '/api/health'
    }
  }

  /**
   * Send text to avatar for speech synthesis
   * @param {string} text - Text to be spoken
   * @param {number} sessionid - Session ID
   * @param {boolean} interrupt - Whether to interrupt current speech
   */
  async sendToAvatar(text, sessionid = 0, interrupt = true) {
    try {
      // Detect language for speech synthesis
      const containsHindiChars = /[\u0900-\u097F]/.test(text)
      const speechLanguage = containsHindiChars ? 'hi' : 'en' // Hindi for Hinglish, English for pure English

      const response = await fetch(this.endpoints.human, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          type: 'echo',
          interrupt,
          sessionid,
          language: speechLanguage // Use detected language (hi for Hinglish, en for English)
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending to avatar:', error)
      throw error
    }
  }

  /**
   * Check if avatar is currently speaking
   * @param {number} sessionid - Session ID
   */
  async isAvatarSpeaking(sessionid = 0) {
    try {
      const response = await fetch(this.endpoints.isSpeaking, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionid })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.code === 0 ? result.data : false
    } catch (error) {
      console.error('Error checking avatar status:', error)
      return false
    }
  }

  /**
   * Wait for avatar to finish speaking
   * @param {number} sessionid - Session ID
   * @param {number} maxAttempts - Maximum number of polling attempts
   * @param {number} pollInterval - Interval between polls in ms
   */
  async waitForAvatarToFinish(sessionid = 0, maxAttempts = 100, pollInterval = 300) {
    return new Promise((resolve) => {
      let attempts = 0
      
      const checkStatus = async () => {
        if (attempts >= maxAttempts) {
          console.warn('Avatar check timeout')
          resolve()
          return
        }

        try {
          const isSpeaking = await this.isAvatarSpeaking(sessionid)
          
          if (!isSpeaking) {
            console.log('✅ Avatar finished speaking')
            resolve()
          } else {
            attempts++
            setTimeout(checkStatus, pollInterval)
          }
        } catch (error) {
          console.error('Error in waitForAvatarToFinish:', error)
          setTimeout(() => resolve(), 2000)
        }
      }

      setTimeout(checkStatus, 800)
    })
  }

  /**
   * Send text and wait for avatar to finish, then execute callback
   * @param {string} text - Text to speak
   * @param {number} sessionid - Session ID
   * @param {Function} callback - Function to call after avatar finishes
   */
  async sendAndWait(text, sessionid = 0, callback = null) {
    try {
      await this.sendToAvatar(text, sessionid, true)
      await this.waitForAvatarToFinish(sessionid)
      if (callback) callback()
    } catch (error) {
      console.error('Error in sendAndWait:', error)
      if (callback) callback()
    }
  }

  /**
   * Generate lip-sync video using MuseTalk
   * @param {Object} options - Video generation options
   */
  async generateVideo(options) {
    try {
      const formData = new FormData()
      
      // Add all options to form data
      for (const [key, value] of Object.entries(options)) {
        if (value !== null && value !== undefined) {
          formData.append(key, value)
        }
      }

      const response = await fetch(this.endpoints.museTalk, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating video:', error)
      throw error
    }
  }

  /**
   * Check health of backend services
   */
  async checkHealth() {
    try {
      const response = await fetch(this.endpoints.health)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error checking health:', error)
      return { status: 'error', message: error.message }
    }
  }
}

// Export singleton instance
const apiService = new APIService()
export default apiService

