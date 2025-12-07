/**
 * Video Service - Maps queries and use cases to YouTube videos
 * Provides video suggestions based on user queries
 * 
 * ═══════════════════════════════════════════════════════════════
 * 📹 HOW TO ADD YOUR YOUTUBE VIDEOS:
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. Get your YouTube video URL:
 *    Example: https://www.youtube.com/watch?v=abc123xyz
 * 
 * 2. Copy either:
 *    - Full URL: https://www.youtube.com/watch?v=abc123xyz
 *    - Just the ID: abc123xyz (the part after v=)
 * 
 * 3. Paste it in the videoId field below (replace the empty string '')
 * 
 * 4. The system will automatically extract the video ID from URLs
 * 
 * ═══════════════════════════════════════════════════════════════
 */

// Video mapping: Maps keywords/use cases to YouTube video IDs
const VIDEO_MAPPINGS = {
  // Government use cases
  government: {
    keywords: ['government', 'govt', 'public sector', 'governance', 'encroachment', 'facial recognition', 'visitor', 'ocr', 'document', 'emergency', 'cctv', 'surveillance'],
    videoId: 'https://youtu.be/ypHQlNbzVvk?si=F0yibxW7JO0gT5w9',
    title: 'Government Use Cases - AI Innovation Challenge'
  },
  
  // Healthcare use cases
  healthcare: {
    keywords: ['healthcare', 'health', 'medical', 'hospital', 'clinical', 'surgical', 'patient', 'medical documents'],
    videoId: 'https://youtu.be/_R_zBiva1a8?si=F6KWIYsGmSKMG5Gk',
    title: 'Healthcare Use Cases - AI Solutions'
  },
  
  // Manufacturing use cases
  manufacturing: {
    keywords: ['manufacturing', 'factory', 'production', 'industrial', 'quality', 'inspection', 'predictive maintenance', 'ev charging'],
    videoId: 'https://youtu.be/RD8zGmT2LMc?si=suE7GQPsVQ4zjE0C',
    title: 'Manufacturing Use Cases - AI Innovation'
  },
  
  // Logistics use cases
  logistics: {
    keywords: ['logistics', 'transport', 'freight', 'shipping', 'yard', 'gate', 'container', 'cfs'],
    videoId: 'https://youtu.be/yxIjMoQt6x4?si=AeZ49RsyTDISu6fW',
    title: 'Logistics Use Cases - AI Solutions'
  },
  
  // General use cases
  useCases: {
    keywords: ['use case', 'use cases', 'challenge', 'innovation challenge', 'ai challenge'],
    videoId: 'https://youtu.be/2QTiv_WzFRo?si=3DSRUJZOa0bB5XQl',
    title: 'AI Innovation Challenge Overview'
  },
  
  // Startups
  startups: {
    keywords: ['startup', 'startups', 'incubated', 'company', 'companies'],
    videoId: 'https://youtu.be/Y6I4e374Ci8?si=MQpaB7u3S0bB5XQl',
    title: 'Incubated Startups at AI CoE'
  },
  
  // GrowX Program
  growx: {
    keywords: ['growx', 'grow x', 'acceleration', 'program', 'funding', 'mentorship'],
    videoId: 'https://youtu.be/ke8L13GqaaA?si=kf1yFb1Ea8ZpkkYK',
    title: 'GrowX Acceleration Program'
  }
}

/**
 * Check if a query should offer a video
 * @param {string} query - User query
 * @param {object} intent - Detected intent
 * @returns {object|null} Video info if available, null otherwise
 */
export function getVideoForQuery(query, intent = null) {
  const lowerQuery = query.toLowerCase()
  
  // Check against video mappings
  for (const [category, mapping] of Object.entries(VIDEO_MAPPINGS)) {
    // Skip if no video ID is configured
    if (!mapping.videoId || mapping.videoId.trim() === '') {
      continue
    }
    
    // Check if any keyword matches
    const hasKeyword = mapping.keywords.some(kw => lowerQuery.includes(kw))
    
    if (hasKeyword) {
      // Additional intent-based matching
      if (intent) {
        // For use cases, check sector
        if (intent.needsUseCases && category === intent.filters?.sector) {
          return {
            videoId: mapping.videoId,
            title: mapping.title,
            category: category
          }
        }
        
        // For startups
        if (intent.needsStartups && category === 'startups') {
          return {
            videoId: mapping.videoId,
            title: mapping.title,
            category: category
          }
        }
        
        // For GrowX
        if (intent.needsGrowX && category === 'growx') {
          return {
            videoId: mapping.videoId,
            title: mapping.title,
            category: category
          }
        }
      }
      
      // Direct keyword match
      return {
        videoId: mapping.videoId,
        title: mapping.title,
        category: category
      }
    }
  }
  
  return null
}

/**
 * Generate video offer message
 * @param {object} videoInfo - Video information
 * @returns {string} Message to ask user if they want to watch video
 */
export function generateVideoOfferMessage(videoInfo) {
  return `Would you like me to play a video about ${videoInfo.title.toLowerCase()}?`
}

/**
 * Extract YouTube video ID from URL or ID
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @returns {string} YouTube video ID
 */
export function extractVideoId(videoIdOrUrl) {
  if (!videoIdOrUrl) {
    console.warn('⚠️ extractVideoId: No video ID or URL provided')
    return null
  }
  
  console.log('🔍 extractVideoId: Input:', videoIdOrUrl)
  
  // If it's already just an ID (11 characters, no special chars)
  if (videoIdOrUrl.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(videoIdOrUrl)) {
    console.log('✅ extractVideoId: Already a video ID:', videoIdOrUrl)
    return videoIdOrUrl
  }
  
  // Extract from URL patterns (handles youtu.be, youtube.com/watch, and embed URLs)
  // Pattern 1: youtu.be/VIDEO_ID or youtu.be/VIDEO_ID?params
  const youtuBeMatch = videoIdOrUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (youtuBeMatch && youtuBeMatch[1]) {
    console.log('✅ extractVideoId: Extracted from youtu.be:', youtuBeMatch[1])
    return youtuBeMatch[1]
  }
  
  // Pattern 2: youtube.com/watch?v=VIDEO_ID
  const watchMatch = videoIdOrUrl.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch && watchMatch[1]) {
    console.log('✅ extractVideoId: Extracted from youtube.com/watch:', watchMatch[1])
    return watchMatch[1]
  }
  
  // Pattern 3: youtube.com/embed/VIDEO_ID
  const embedMatch = videoIdOrUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch && embedMatch[1]) {
    console.log('✅ extractVideoId: Extracted from youtube.com/embed:', embedMatch[1])
    return embedMatch[1]
  }
  
  // Pattern 4: Just the ID at the end of any URL
  const idMatch = videoIdOrUrl.match(/([a-zA-Z0-9_-]{11})(?:\?|$)/)
  if (idMatch && idMatch[1]) {
    console.log('✅ extractVideoId: Extracted ID from URL:', idMatch[1])
    return idMatch[1]
  }
  
  console.error('❌ extractVideoId: Could not extract video ID from:', videoIdOrUrl)
  return null
}

export default {
  getVideoForQuery,
  generateVideoOfferMessage,
  extractVideoId,
  VIDEO_MAPPINGS
}

