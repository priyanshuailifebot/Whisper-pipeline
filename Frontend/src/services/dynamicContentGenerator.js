/**
 * Dynamic Content Generator - Creates visual slides from pre-parsed knowledge base
 * Generates content for startups, use cases, programs, etc. with instant access
 */

import { getParsedKnowledgeBase, getExactMatches, filterBySector } from './knowledgeBase.js'

/**
 * Generate startup content using pre-parsed knowledge base (instant access)
 */
export async function generateStartupContent(query = '', intent = null) {
  const kb = getParsedKnowledgeBase()

  // Get exact matches from pre-parsed data
  let matchingStartups = getExactMatches(query, 'startups')

  // Apply sector filter if detected
  if (intent?.filters.sector) {
    matchingStartups = filterBySector(matchingStartups, intent.filters.sector)
    console.log(`🔍 Filtered to ${matchingStartups.length} ${intent.filters.sector} startups`)
  }

  // Apply entity filter if specific startup requested
  if (intent?.filters.entity) {
    matchingStartups = matchingStartups.filter(s => s.name.toLowerCase().includes(intent.filters.entity))
    console.log(`🔍 Filtered to specific startup: ${intent.filters.entity}`)
  }

  // If no matches found, don't show content
  if (matchingStartups.length === 0) {
    console.log('⚠️ No startup matches found for query')
    return null
  }

  // Single startup view
  if (matchingStartups.length === 1) {
    const startup = matchingStartups[0]
    return {
      id: `startup-${startup.id}-${Date.now()}`,
      title: startup.name,
      subtitle: 'Deep Tech Startup Solution',
      summary: startup.desc,
      sections: [
        {
          type: 'text',
          content: `${startup.name} is one of our incubated deep tech startups providing innovative AI solutions in the ${startup.sector} sector.`
        },
        {
          type: 'startups-grid',
          items: [{
            id: startup.id.toString(),
            name: startup.name,
            description: startup.desc,
            category: startup.sector
          }]
        }
      ]
    }
  }

  // Multiple startups view (sector-based)
  const sector = matchingStartups[0].sector
  return {
    id: `startups-${sector}-${Date.now()}`,
    title: `${sector.charAt(0).toUpperCase() + sector.slice(1)} Startups`,
    subtitle: `${matchingStartups.length} Deep Tech Solutions`,
    summary: `We have incubated ${matchingStartups.length} deep tech startups building AI solutions in the ${sector} sector.`,
    sections: [
      {
        type: 'text',
        content: `These ${matchingStartups.length} ${sector} startups are building cutting-edge AI solutions.`
      },
      {
        type: 'startups-grid',
        items: matchingStartups.map(s => ({
          id: s.id.toString(),
          name: s.name,
          description: s.desc,
          category: s.sector
        }))
      }
    ]
  }
}

/**
 * Generate use case content using pre-parsed knowledge base
 */
export async function generateUseCasesContent(query = '', intent = null) {
  const kb = getParsedKnowledgeBase()

  // Get exact matches from pre-parsed data
  let matchingCases = getExactMatches(query, 'useCases')

  // Apply sector filter if detected
  if (intent?.filters.sector) {
    matchingCases = filterBySector(matchingCases, intent.filters.sector)
    console.log(`🔍 Filtered to ${matchingCases.length} ${intent.filters.sector} use cases`)
  }

  // If no matches found, don't show content
  if (matchingCases.length === 0) {
    console.log('⚠️ No use case matches found for query')
    return null
  }

  // Determine sector for title
  const sector = intent?.filters.sector
    ? intent.filters.sector.charAt(0).toUpperCase() + intent.filters.sector.slice(1)
    : 'AI Innovation Challenge'

  return {
    id: `usecases-${sector.toLowerCase()}-${Date.now()}`,
    title: sector === 'AI Innovation Challenge' ? sector + ' Use Cases' : `${sector} Use Cases`,
    subtitle: `${matchingCases.length} Real-World AI Implementation Opportunities`,
    summary: `The AI Innovation Challenge features ${matchingCases.length} ${sector.toLowerCase()} use cases seeking innovative AI solutions.`,
    sections: [
      {
        type: 'text',
        content: `These ${matchingCases.length} use cases represent real opportunities for startups to develop and deploy AI solutions in the ${sector.toLowerCase()} sector.`
      },
      {
        type: 'usecases-grid',
        items: matchingCases.map(uc => ({
          id: uc.id.toString(),
          title: uc.title,
          nominatedBy: uc.org,
          description: uc.desc.substring(0, 400) + (uc.desc.length > 400 ? '...' : ''),
          sector: uc.sector
        }))
      }
    ]
  }
}

/**
 * Generate GrowX program content
 */
export async function generateGrowXContent() {
  const kb = getParsedKnowledgeBase()

  return {
    id: `growx-${Date.now()}`,
    title: 'GrowX Acceleration Program',
    subtitle: 'Complete Deep Tech Startup Ecosystem',
    summary: kb.growX.description,
    sections: [
      {
        type: 'text',
        content: kb.growX.description
      },
      {
        type: 'benefits',
        title: 'Complete Acceleration Ecosystem',
        items: kb.growX.benefits
      },
      {
        type: 'text',
        content: 'COE is building a comprehensive panel of mentors who can guide startups through their entire growth journey - from product-market fit and design validation to fundraising, valuation assessment, market reach strategies, and scaling operations. Mentor details will be hosted on COE website for startups to request personalized mentorship sessions.'
      }
    ]
  }
}

/**
 * Detect startup category from description
 */
function detectStartupCategory(description) {
  const lower = description.toLowerCase()
  
  if (lower.includes('health') || lower.includes('medical') || lower.includes('clinical')) {
    return 'Healthcare'
  } else if (lower.includes('manufacturing') || lower.includes('industrial') || lower.includes('factory')) {
    return 'Manufacturing'
  } else if (lower.includes('agriculture') || lower.includes('farming') || lower.includes('crop')) {
    return 'Agriculture'
  } else if (lower.includes('legal') || lower.includes('law') || lower.includes('police')) {
    return 'Legal & Governance'
  } else if (lower.includes('video') || lower.includes('surveillance') || lower.includes('cctv')) {
    return 'Safety & Security'
  } else if (lower.includes('aviation') || lower.includes('traffic') || lower.includes('road')) {
    return 'Transportation'
  } else if (lower.includes('food') || lower.includes('grain')) {
    return 'Food & Agriculture'
  }
  
  return 'Technology'
}

/**
 * Main function to generate dynamic content based on intent (100% accuracy)
 * Enhanced to handle detailed queries that want slides
 */
export async function generateDynamicContent(query, intent = null) {
  const lowerQuery = query.toLowerCase()

  // If no intent provided, detect it
  if (!intent) {
    const { detectIntent } = await import('./intentDetection.js')
    intent = detectIntent(query)
  }

  // Level 1: Exact intent matches
  if (intent.needsStartups) {
    const content = await generateStartupContent(query, intent)
    if (content) return content
  }

  if (intent.needsUseCases) {
    const content = await generateUseCasesContent(query, intent)
    if (content) return content
  }

  if (intent.needsGrowX) {
    return await generateGrowXContent()
  }

  // Level 2: Detailed queries about specific topics (even without exact intent match)
  // Check for detailed queries about key topics
  if (lowerQuery.includes('startup') || lowerQuery.includes('startups') ||
      lowerQuery.includes('company') || lowerQuery.includes('companies')) {
    const content = await generateStartupContent(query, { filters: { sector: null } })
    if (content) return content
  }

  if (lowerQuery.includes('use case') || lowerQuery.includes('challenge') ||
      lowerQuery.includes('innovation') || lowerQuery.includes('application')) {
    const content = await generateUseCasesContent(query, { filters: { sector: null } })
    if (content) return content
  }

  if (lowerQuery.includes('growx') || lowerQuery.includes('program') ||
      lowerQuery.includes('acceleration') || lowerQuery.includes('funding')) {
    return await generateGrowXContent()
  }

  if (lowerQuery.includes('policy') || lowerQuery.includes('incentive') ||
      lowerQuery.includes('support') || lowerQuery.includes('grant')) {
    const kb = getParsedKnowledgeBase()
    return {
      id: `policy-overview-${Date.now()}`,
      title: 'Gujarat IT/ITeS Policy Incentives',
      subtitle: 'Comprehensive Support for Deep Tech',
      summary: 'The Gujarat Government offers extensive incentives for ICT & Deep Tech startups including funding support, patent assistance, infrastructure benefits, and specialized programs.',
      sections: [
        {
          type: 'text',
          content: 'The policy provides comprehensive support through multiple categories including CAPEX/OPEX incentives, patent assistance, cloud infrastructure support, and specialized programs for incubators and accelerators.'
        },
        {
          type: 'incentives',
          title: 'Key Incentives',
          items: kb.incentives.slice(0, 6) // Show top incentives
        }
      ]
    }
  }

  if (lowerQuery.includes('indiaai') || lowerQuery.includes('india ai') ||
      lowerQuery.includes('mission') || lowerQuery.includes('pillar')) {
    const kb = getParsedKnowledgeBase()
    return {
      id: `indiaai-overview-${Date.now()}`,
      title: 'IndiaAI Mission',
      subtitle: 'National AI Ecosystem Development',
      summary: kb.indiaAI.mission,
      sections: [
        {
          type: 'text',
          content: kb.indiaAI.mission
        },
        {
          type: 'list',
          title: 'Seven Pillars',
          items: kb.indiaAI.pillars.map(p => p.name + ' - ' + p.desc)
        }
      ]
    }
  }

  // Return null if no matching content (no fallback)
  return null
}

export default {
  generateStartupContent,
  generateUseCasesContent,
  generateGrowXContent,
  generateDynamicContent
}

