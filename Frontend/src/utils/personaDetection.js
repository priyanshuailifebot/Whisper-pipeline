/**
 * Persona Detection Engine
 * Analyzes conversation to identify visitor type (startup, investor, corporate, student, general)
 * Based on kiosk-assistant.js persona inference logic
 */

// Persona patterns and keywords
const personaPatterns = {
  startup: {
    keywords: [
      'startup', 'founder', 'entrepreneur', 'business', 'funding', 'investment',
      'pitch', 'prototype', 'scale', 'growth', 'revenue', 'market', 'traction',
      'bootstrap', 'angel', 'vc', 'seed', 'series', 'raise', 'capital'
    ],
    questions: [
      'funding', 'incubation', 'mentorship', 'workspace', 'accelerator',
      'investors', 'pitch deck', 'valuation', 'equity'
    ],
    responses: {
      greeting: "I see you're interested in our startup programs. We offer comprehensive support through our GrowX Acceleration Program.",
      followup: "What stage is your venture at? Are you looking for funding or incubation support?"
    }
  },
  
  investor: {
    keywords: [
      'invest', 'funding', 'portfolio', 'returns', 'due diligence', 'valuation',
      'equity', 'roi', 'irr', 'venture', 'capital', 'angel', 'mentor', 'advisory',
      'exit', 'acquisition'
    ],
    questions: [
      'startups', 'portfolio', 'success rate', 'returns', 'demo day',
      'partnerships', 'deal flow'
    ],
    responses: {
      greeting: "I understand you're interested in our startup ecosystem and investment opportunities.",
      followup: "Are you looking to invest in specific sectors, or would you like to see our overall portfolio?"
    }
  },
  
  corporate: {
    keywords: [
      'corporate', 'company', 'enterprise', 'partnership', 'collaboration',
      'innovation', 'research', 'csr', 'procurement', 'vendor', 'supplier',
      'b2b', 'integration', 'api', 'pilots', 'poc'
    ],
    questions: [
      'partnerships', 'innovation challenges', 'poc', 'corporate programs',
      'csr initiatives', 'technology scouting'
    ],
    responses: {
      greeting: "I see you're exploring corporate partnerships and innovation opportunities.",
      followup: "Are you interested in partnerships, CSR initiatives, or innovation challenges?"
    }
  },
  
  student: {
    keywords: [
      'student', 'university', 'college', 'internship', 'research', 'project',
      'learn', 'training', 'workshop', 'hackathon', 'competition', 'scholarship',
      'academia', 'thesis', 'study', 'education'
    ],
    questions: [
      'internships', 'hackathons', 'workshops', 'research collaboration',
      'stipend', 'learning programs', 'courses'
    ],
    responses: {
      greeting: "I understand you're interested in our educational programs and research opportunities.",
      followup: "Are you looking for internship opportunities, workshops, or research collaboration?"
    }
  },
  
  general: {
    keywords: [
      'visit', 'tour', 'facility', 'center', 'location', 'hours', 'parking',
      'contact', 'information', 'overview', 'about', 'what', 'how', 'when', 'where'
    ],
    questions: [
      'facilities', 'tours', 'location', 'hours', 'contact', 'information'
    ],
    responses: {
      greeting: "Welcome! I'd be happy to provide information about Nasscom COE.",
      followup: "What would you like to know about our center?"
    }
  }
}

/**
 * Analyze conversation history to infer persona
 * @param {Array<string>} conversationHistory - Array of user messages
 * @returns {Object} - Persona analysis with confidence scores
 */
export function analyzePersona(conversationHistory) {
  if (!conversationHistory || conversationHistory.length === 0) {
    return {
      persona: 'general',
      confidence: 0,
      allScores: []
    }
  }

  // Combine all conversation into one text for analysis
  const fullConversation = conversationHistory.join(' ').toLowerCase()
  
  // Calculate confidence scores for each persona
  const scores = {}
  
  Object.keys(personaPatterns).forEach(persona => {
    const pattern = personaPatterns[persona]
    let score = 0
    
    // Check keywords with word boundary matching
    pattern.keywords.forEach(keyword => {
      const regex = new RegExp('\\b' + keyword + '\\w*', 'gi')
      const matches = fullConversation.match(regex)
      if (matches) {
        score += matches.length * 0.4 // Count multiple mentions
      }
    })
    
    // Check question patterns (higher weight)
    pattern.questions.forEach(question => {
      if (fullConversation.includes(question)) {
        score += 0.7
      }
    })
    
    scores[persona] = Math.min(1.0, score)
  })
  
  // Find highest confidence persona
  let maxConfidence = 0
  let inferredPersona = 'general'
  
  Object.entries(scores).forEach(([persona, confidence]) => {
    if (confidence > maxConfidence) {
      maxConfidence = confidence
      inferredPersona = persona
    }
  })
  
  // Sort all scores for analysis
  const allScores = Object.entries(scores)
    .map(([persona, confidence]) => ({ persona, confidence }))
    .sort((a, b) => b.confidence - a.confidence)
  
  return {
    persona: inferredPersona,
    confidence: maxConfidence,
    allScores
  }
}

/**
 * Get personalized response based on persona
 * @param {string} persona - Detected persona type
 * @param {string} type - 'greeting' or 'followup'
 * @returns {string} - Personalized response
 */
export function getPersonalizedResponse(persona, type = 'greeting') {
  const pattern = personaPatterns[persona] || personaPatterns.general
  return pattern.responses[type] || pattern.responses.greeting
}

/**
 * Should we infer persona based on conversation length?
 * @param {number} conversationLength - Number of user messages
 * @returns {boolean}
 */
export function shouldInferPersona(conversationLength) {
  return conversationLength >= 2 // After 2 user messages, start inferring
}

/**
 * Get follow-up questions based on current persona inference
 * @param {string} topPersona - Current leading persona
 * @param {number} conversationLength - Length of conversation
 * @returns {string} - Follow-up question
 */
export function getFollowUpQuestion(topPersona, conversationLength) {
  const contextualQuestions = {
    startup: [
      "What stage is your venture at? Are you looking for funding or incubation support?",
      "Tell me about your product or service. What problem are you solving?",
      "Are you interested in mentorship, funding, or workspace facilities?"
    ],
    investor: [
      "Are you looking to invest in specific sectors, or would you like to see our overall portfolio?",
      "What type of returns or collaboration model interests you?",
      "Would you like information about our demo days or portfolio companies?"
    ],
    corporate: [
      "Are you exploring partnerships, CSR initiatives, or innovation challenges?",
      "What kind of collaboration are you interested in - technology pilots or joint R&D?",
      "Would you like to know about our corporate partnership models?"
    ],
    student: [
      "Are you looking for internship opportunities, workshops, or research collaboration?",
      "Which area interests you more - AI, IoT, or general skill development?",
      "Are you here for a specific program or general exploration?"
    ],
    general: [
      "Would you like a tour of our facilities or information about specific programs?",
      "What aspect of our center interests you the most?",
      "Are you here for business, education, or just to learn more about us?"
    ]
  }
  
  const questions = contextualQuestions[topPersona] || contextualQuestions.general
  const questionIndex = Math.min(conversationLength - 1, questions.length - 1)
  return questions[questionIndex]
}

export default {
  analyzePersona,
  getPersonalizedResponse,
  shouldInferPersona,
  getFollowUpQuestion,
  personaPatterns
}

