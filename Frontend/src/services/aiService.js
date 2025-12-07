/**
 * Azure OpenAI Service - Natural Conversation AI
 * Integrates with Azure OpenAI GPT-4o for dynamic conversations
 * Handles persona detection, memory management, and contextual responses
 */

import { getRelevantSections, initializeKnowledgeBase } from './knowledgeBase.js'

// Configuration from environment variables (Vite uses import.meta.env)
// IMPORTANT: Never commit API keys! Use .env file with VITE_AZURE_OPENAI_API_KEY
const AZURE_CONFIG = {
  apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
  endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://openai-04.openai.azure.com/',
  apiVersion: import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
  deployment: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
}

// Validate that API key is provided
if (!AZURE_CONFIG.apiKey) {
  console.warn('⚠️ VITE_AZURE_OPENAI_API_KEY not set. AI service will not work. Create .env file with your Azure OpenAI key.')
}

// Initialize knowledge base on module load
initializeKnowledgeBase()

// Nasscom COE context and knowledge base
const NASSCOM_CONTEXT = `
You are Mira, the friendly and knowledgeable AI assistant at Nasscom AI & IoT Centre of Excellence located in GIFT City, Gandhinagar, Gujarat. You engage in natural, conversational dialogue and keep responses brief unless asked for details.

ABOUT Nasscom COE:
- Founded in July 2016 through MeitY-State Government-Nasscom partnership
- 4 strategic locations: Gandhinagar (GIFT City), Bangalore, Gurugram, Vizag
- AI COE at GIFT City inaugurated by Honourable Chief Minister of Gujarat on 27th January 2025
- Mission: Deep tech innovation, startup acceleration, IP creation, market development

KEY ACHIEVEMENTS:
- 160+ enterprises engaged for co-creation
- 500+ startups collaborated with
- 200+ prototypes developed
- 50+ successful deployments
- Full occupancy labs across all locations

PROGRAMS & SERVICES:
1. AI Innovation Challenge - Connects startups with real-world challenges
2. GrowX Acceleration Program - Complete startup ecosystem support
3. AI Experience Zone - Cutting-edge solution showcase
4. Industry digitalization for MSMEs with Industry 4.0 solutions

GUJARAT IT/ITeS POLICY INCENTIVES:
1. R&D Support: 25% up to ₹25 Lakhs for prototype development
2. Patent Assistance: 75% up to ₹5L (Domestic)/₹10L (International), max 10 patents/year for 5 years
3. Quality Certification: 50% up to ₹5 Lakhs per certificate, max 3 certifications
4. Cloud & Infrastructure: 35% up to ₹10 Lakhs for bandwidth/cloud costs (6 months)
5. Lease Rental Support: ₹25/sq.ft or ₹1250/seat per month for 5 years

SUCCESS STORY:
AI-powered grain quality assessment system deployed at APMCs in Kheda and Anand, Gujarat:
- Empowered 1000+ farmers
- Facilitated ₹700+ crore grain trade
- 30-second evaluation of 10+ grain parameters
- Ensures fair pricing and reduces rejection losses

PERSONA AWARENESS:
- Startups: Focus on funding, incubation, mentorship, GrowX program
- Investors: Portfolio opportunities, returns, demo days, partnerships
- Corporates: Innovation challenges, CSR, partnerships, PoCs
- Students: Internships, workshops, research collaboration
- Government: Policy implementation, digitalization, public services
- General: Tours, facilities, general information

CONVERSATION STYLE:
- [LANGUAGE RULE WILL BE SET DYNAMICALLY BASED ON USER INPUT]
- Natural, warm, and helpful (not robotic)
- CRITICAL: BE CONVERSATIONAL AND BRIEF - Keep responses to 1-2 sentences by default
- ONLY give detailed, long explanations when user SPECIFICALLY asks with phrases like:
  * "tell me more about"
  * "explain in detail"
  * "elaborate on"
  * "can you expand on that"
  * "give me more information"
  * "what are the details"
- If user asks a general question like "what is GrowX", give a brief overview and ask if they want more details
- Remember names and context from previous interactions
- Ask 1 relevant follow-up question to engage conversation
- Use "we" when referring to Nasscom COE (always use COE not CoE)
- Maintain professional yet friendly, conversational tone
- NEVER dump all information at once - be engaging and interactive
- ABSOLUTELY DO NOT give long explanations unless user explicitly asks for details

CRITICAL SPEECH OUTPUT RULES:
- [LANGUAGE RULE WILL BE SET DYNAMICALLY BASED ON USER INPUT]
- DO NOT use markdown formatting (no **, *, _, etc.)
- DO NOT use emojis of any kind
- DO NOT use special characters like #, ###, >, -, •, etc.
- Use plain text only for natural speech
- Write numbers as words when appropriate (e.g., "two thousand" not "2000")
- Use "COE" not "CoE" for correct pronunciation (C-O-E)
`

// Conversation memory storage
class ConversationMemory {
  constructor() {
    this.sessions = new Map()
  }

  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        messages: [],
        userInfo: {},
        detectedPersona: null,
        context: {},
        createdAt: new Date(),
        lastActivity: new Date()
      })
    }
    return this.sessions.get(sessionId)
  }

  addMessage(sessionId, role, content) {
    const session = this.getSession(sessionId)
    session.messages.push({
      role,
      content,
      timestamp: new Date()
    })
    session.lastActivity = new Date()
    
    // Keep only last 20 messages for context window management
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20)
    }
  }

  updateUserInfo(sessionId, info) {
    const session = this.getSession(sessionId)
    session.userInfo = { ...session.userInfo, ...info }
  }

  updatePersona(sessionId, persona) {
    const session = this.getSession(sessionId)
    session.detectedPersona = persona
  }

  getConversationHistory(sessionId) {
    const session = this.getSession(sessionId)
    return session.messages
  }

  clearSession(sessionId) {
    this.sessions.delete(sessionId)
  }

  // Clean up old sessions (older than 24 hours)
  cleanup() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoff) {
        this.sessions.delete(sessionId)
      }
    }
  }
}

// Global memory instance
const conversationMemory = new ConversationMemory()

// Clean up old sessions periodically
setInterval(() => {
  conversationMemory.cleanup()
}, 60 * 60 * 1000) // Every hour

/**
 * Generate session ID based on browser session
 */
function generateSessionId() {
  // In a real kiosk, this might be based on face recognition or user login
  // For now, use a simple session-based approach
  if (!sessionStorage.getItem('kioskSessionId')) {
    sessionStorage.setItem('kioskSessionId', 
      'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    )
  }
  return sessionStorage.getItem('kioskSessionId')
}

/**
 * Detect if user is asking for detailed explanation
 */
function isRequestingDetail(message) {
  const detailPhrases = [
    'tell me more',
    'explain in detail',
    'elaborate',
    'expand on',
    'more information',
    'can you explain',
    'tell me about',
    'what are',
    'how does',
    'describe',
    'details about'
  ]
  
  const lowerMessage = message.toLowerCase()
  return detailPhrases.some(phrase => lowerMessage.includes(phrase))
}

/**
 * Call Azure OpenAI API
 */
async function callAzureOpenAI(messages, requestDetail = false) {
  const url = `${AZURE_CONFIG.endpoint}openai/deployments/${AZURE_CONFIG.deployment}/chat/completions?api-version=${AZURE_CONFIG.apiVersion}`
  
  // Use more tokens if user requests detail
  const maxTokens = requestDetail ? 800 : 300
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_CONFIG.apiKey
      },
      body: JSON.stringify({
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stop: null
      })
    })

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'I apologize, but I encountered an issue generating a response. Please try again.'
  } catch (error) {
    console.error('Azure OpenAI API Error:', error)
    return `I'm having trouble connecting to my knowledge base right now. However, I can tell you that Nasscom AI & IoT Centre of Excellence is India's premier deep tech innovation hub with 160+ enterprises, 200+ prototypes, and comprehensive support for startups through our GrowX program and Gujarat government incentives.`
  }
}

/**
 * Extract user information from conversation
 */
function extractUserInfo(message) {
  const info = {}
  
  // Extract name patterns
  const namePatterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /call me (\w+)/i,
    /this is (\w+)/i
  ]
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern)
    if (match) {
      info.name = match[1]
      break
    }
  }

  // Extract company/organization
  const companyPatterns = [
    /i work at (\w+)/i,
    /from (\w+) company/i,
    /represent (\w+)/i,
    /i'm with (\w+)/i
  ]
  
  for (const pattern of companyPatterns) {
    const match = message.match(pattern)
    if (match) {
      info.company = match[1]
      break
    }
  }

  return info
}

/**
 * Detect if text contains Hindi/Devanagari characters
 */
function containsHindi(text) {
  // Check for Devanagari script (Hindi, Marathi, Sanskrit, etc.)
  return /[\u0900-\u097F]/.test(text)
}

/**
 * Detect if text contains Gujarati characters
 */
function containsGujarati(text) {
  // Check for Gujarati script
  return /[\u0A80-\u0AFF]/.test(text)
}

/**
 * Detect if text contains Romanized Hindi words (more strict detection)
 */
function containsRomanizedHindi(text) {
  // Core Hindi words that clearly indicate Hinglish intent
  const strongHindiWords = [
    /\bmujhe\b/i, /\baapko\b/i, /\baap\b/i, /\bhumko\b/i, /\btumko\b/i,
    /\bkaise\b/i, /\bkaisa\b/i, /\bkaisi\b/i, /\bkahan\b/i, /\bkahaan\b/i,
    /\bkyun\b/i, /\bkyon\b/i, /\bkab\b/i, /\bkitna\b/i, /\bkitne\b/i, /\bkitni\b/i,
    /\bchahiye\b/i, /\bchahiye\b/i, /\bchahie\b/i, /\bchahta\b/i, /\bchahti\b/i,
    /\bdijiye\b/i, /\bdijie\b/i, /\bkijiye\b/i, /\bkijie\b/i,
    /\bsamjha\b/i, /\bsamjhe\b/i, /\bsamjho\b/i, /\bsamajh\b/i,
    /\bbata\b/i, /\bbatao\b/i, /\bbataiye\b/i, /\bbataye\b/i,
    /\bsuna\b/i, /\bsunao\b/i, /\bsuniye\b/i,
    /\bdekha\b/i, /\bdekhiye\b/i, /\bdekhna\b/i,
    /\bkarna\b/i, /\bkaro\b/i, /\bkariye\b/i,
    /\bjana\b/i, /\bjao\b/i, /\bjaiye\b/i,
    /\blana\b/i, /\blao\b/i, /\blaiye\b/i,
    /\bboliye\b/i, /\bbolo\b/i, /\bbolna\b/i,
    /\bmein\b/i, /\bmujhe\b/i, /\bhumein\b/i
  ];

  const lowerText = text.toLowerCase();
  
  // Count how many strong Hindi words are present
  let hindiWordCount = 0;
  for (const pattern of strongHindiWords) {
    if (pattern.test(lowerText)) {
      hindiWordCount++;
    }
  }
  
  // Require at least 2 clear Hindi words to trigger Hinglish mode
  return hindiWordCount >= 2;
}

/**
 * Determine appropriate response language based on user input
 */
function detectResponseLanguage(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for explicit language request
  if (lowerMessage.includes('hindi') || lowerMessage.includes('hinglish') || 
      lowerMessage.includes('hindi mein') || lowerMessage.includes('hindi me')) {
    return 'hinglish';
  }
  
  // Check for Devanagari/Gujarati script
  if (containsHindi(userMessage) || containsGujarati(userMessage)) {
    return 'hinglish';
  }

  // Check for Romanized Hindi words (strict - needs multiple clear Hindi words)
  if (containsRomanizedHindi(userMessage)) {
    return 'hinglish';
  }

  // Default to English
  return 'english';
}

/**
 * Generate contextual system message based on persona, user info, and language
 */
async function generateSystemMessage(session, userMessage = '', intent = null) {
  let systemMessage = NASSCOM_CONTEXT

  // Load ONLY relevant sections based on intent (sectioned context injection)
  if (intent && (intent.needsStartups || intent.needsUseCases || intent.needsGrowX || intent.needsIncentives || intent.needsIndiaAI)) {
    const relevantSections = getRelevantSections(intent)
    if (relevantSections) {
      systemMessage += `\n\n=== RELEVANT KNOWLEDGE BASE SECTIONS ===\n${relevantSections}\n=== END KNOWLEDGE BASE ===\n`
      console.log('✅ Relevant sections included:', relevantSections.length, 'characters')
      console.log('📊 Intent-based filtering reduced context by', Math.round((1 - relevantSections.length / 40000) * 100), '%')
    }
  } else {
    console.log('💬 No specific intent detected - using basic context only')
  }

  // Detect appropriate response language
  const responseLanguage = detectResponseLanguage(userMessage)

  if (responseLanguage === 'hinglish') {
    // Replace language rule placeholders with Hinglish rules
    systemMessage = systemMessage.replace(
      '[LANGUAGE RULE WILL BE SET DYNAMICALLY BASED ON USER INPUT]',
      'RESPOND IN HINGLISH - Mix Hindi and English naturally. Use Hindi words like "aap", "aapko", "hai", "kya", "kaise", "mujhe", "chahiye" mixed with English words. Example: "Aapko pata hai, yeh solution 1000+ farmers ko help karta hai." Keep it natural and conversational.'
    )
  } else {
    // Replace language rule placeholders with English-only rules
    systemMessage = systemMessage.replace(
      '[LANGUAGE RULE WILL BE SET DYNAMICALLY BASED ON USER INPUT]',
      'You MUST ALWAYS respond in PURE ENGLISH ONLY. Do NOT use any Hindi words, Hinglish, or any other language except English. Even if the user uses some Hindi words, you respond ONLY in English. This is critical - NO Hindi words at all in your response.'
    )
  }

  systemMessage += '\n\nIMPORTANT: When asked about startups, use cases, programs, or specific details, refer to the KNOWLEDGE BASE above. However, ALWAYS BE BRIEF AND CONVERSATIONAL - give a short overview first, then ask if they want more details. NEVER dump all information at once.\n\nCRITICAL: Keep ALL responses conversational and brief (1-2 sentences). Only expand when user explicitly asks "tell me more" or "explain in detail".'

  if (session.detectedPersona) {
    systemMessage += `\n\nDETECTED PERSONA: ${session.detectedPersona.toUpperCase()}`
    systemMessage += `\nTailor your responses specifically for ${session.detectedPersona} interests and needs.`
  }

  if (session.userInfo.name) {
    systemMessage += `\n\nUSER NAME: ${session.userInfo.name}`
    systemMessage += `\nAddress the user by name naturally in conversation.`
  }

  if (session.userInfo.company) {
    systemMessage += `\nUSER COMPANY: ${session.userInfo.company}`
    systemMessage += `\nConsider their organizational context when relevant.`
  }

  if (session.messages.length > 0) {
    systemMessage += `\n\nCONVERSATION CONTEXT: This is a continuing conversation. Refer to previous context when relevant.`
  }

  return systemMessage
}

/**
 * Main AI service function
 */
export async function getAIResponse(userMessage, detectedPersona = null, intent = null) {
  const sessionId = generateSessionId()
  const session = conversationMemory.getSession(sessionId)
  
  // Update persona if detected
  if (detectedPersona && detectedPersona !== session.detectedPersona) {
    conversationMemory.updatePersona(sessionId, detectedPersona)
  }

  // Extract and store user information
  const userInfo = extractUserInfo(userMessage)
  if (Object.keys(userInfo).length > 0) {
    conversationMemory.updateUserInfo(sessionId, userInfo)
  }

  // Add user message to memory
  conversationMemory.addMessage(sessionId, 'user', userMessage)

  // Check for video availability (only if user hasn't already confirmed)
  const lowerMessage = userMessage.toLowerCase()
  const hasVideoConfirmation = lowerMessage.includes('yes') || lowerMessage.includes('play') || lowerMessage.includes('show') || lowerMessage.includes('watch')
  
  const { getVideoForQuery, generateVideoOfferMessage } = await import('./videoService.js')
  const videoInfo = getVideoForQuery(userMessage, intent)
  
  // Prepare messages for API call with intent-based context
  const systemMessage = await generateSystemMessage(session, userMessage, intent)
  const conversationHistory = session.messages.slice(-10) // Last 10 messages for context

  // Log detected language for debugging
  const responseLanguage = detectResponseLanguage(userMessage)
  console.log(`🗣️ Detected user language: ${responseLanguage === 'hinglish' ? 'Hindi/Gujarati → responding in Hinglish' : 'English → responding in English'}`)
  
  const messages = [
    { role: 'system', content: systemMessage },
    ...conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ]

  // Check if user is requesting detailed response
  const requestingDetail = isRequestingDetail(userMessage)
  console.log(`📝 Response mode: ${requestingDetail ? 'DETAILED' : 'BRIEF'}`)

  // Get AI response
  let aiResponse = await callAzureOpenAI(messages, requestingDetail)
  
  // Append video offer if video is available and user hasn't already confirmed
  if (videoInfo && !hasVideoConfirmation) {
    const videoOffer = generateVideoOfferMessage(videoInfo)
    aiResponse = `${aiResponse} ${videoOffer}`
    console.log('🎥 Video available for query:', videoInfo.title)
  }
  
  // Store AI response in memory
  conversationMemory.addMessage(sessionId, 'assistant', aiResponse)

  return {
    response: aiResponse,
    session: session,
    sessionId: sessionId,
    videoInfo: videoInfo || null
  }
}

/**
 * Get conversation history for a session
 */
export function getConversationHistory(sessionId = null) {
  if (!sessionId) {
    sessionId = generateSessionId()
  }
  return conversationMemory.getConversationHistory(sessionId)
}

/**
 * Clear conversation session
 */
export function clearSession(sessionId = null) {
  if (!sessionId) {
    sessionId = generateSessionId()
  }
  conversationMemory.clearSession(sessionId)
  sessionStorage.removeItem('kioskSessionId')
}

/**
 * Check if user is returning visitor
 */
export function isReturningUser() {
  return sessionStorage.getItem('kioskSessionId') !== null
}

/**
 * Handle wake word detection
 */
export function handleWakeWord() {
  const sessionId = generateSessionId()
  const session = conversationMemory.getSession(sessionId)
  
  // Return appropriate greeting based on context
  if (session.userInfo.name) {
    return `Hello ${session.userInfo.name}! How can I help you today?`
  } else if (session.messages.length > 0) {
    return "Hi there! I'm back to help you. What would you like to know?"
  } else {
    return "Hello! I'm Mira, your AI assistant at Nasscom Centre of Excellence. How may I help you today?"
  }
}

export default {
  getAIResponse,
  getConversationHistory,
  clearSession,
  isReturningUser,
  handleWakeWord
}
