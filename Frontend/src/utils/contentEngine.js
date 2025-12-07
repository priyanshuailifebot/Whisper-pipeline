/**
 * Content Engine - Maps user queries to relevant Nasscom COE content
 * Based on Information_COE_plain.txt
 */

// Structured content database from Information_COE_plain.txt
const contentDatabase = {
  welcome: {
    id: 'welcome',
    title: 'Nasscom AI & IoT Centre of Excellence',
    subtitle: 'GIFT City, Gandhinagar • Inaugurated by Hon\'ble Chief Minister of Gujarat',
    summary: 'Welcome to India\'s premier deep tech innovation hub. Founded in 2016 through MeitY-State Government-Nasscom partnership, we\'ve successfully deployed 200+ prototypes across 160+ enterprises.',
    sections: [
      {
        type: 'hero',
        content: 'Deep Tech Innovation for Digital India'
      },
      {
        type: 'stats',
        items: [
          { label: 'Enterprises Engaged', value: '160+' },
          { label: 'Prototypes Developed', value: '200+' },
          { label: 'Successful Deployments', value: '50+' },
          { label: 'Strategic Locations', value: '4 Cities' }
        ]
      },
      {
        type: 'text',
        content: 'Operating from Bangalore, Gurugram, Gandhinagar (GIFT City), and Vizag, we serve as the nation\'s leading deep tech startup accelerator, focusing on IP creation and market development through co-creation and open innovation.'
      },
      {
        type: 'highlights',
        items: [
          'Pan India Deep Tech Startup Growth Enablement',
          'Largest Industry Network for Co-Creation',
          'Global Showcase for India\'s Innovation Story',
          '200+ AI Prototypes • 50+ Market Deployments'
        ]
      }
    ]
  },

  about: {
    id: 'about',
    title: 'About Nasscom Centre of Excellence',
    subtitle: 'India\'s Premier Deep Tech Innovation Hub',
    summary: 'MeitY COE is one of the most effective enablers of deep tech startup ecosystem focused on IP and Market Creation. Through co-creation and open innovation, we have made these concepts reality in India.',
    sections: [
      {
        type: 'carousel',
        title: 'AI Centre of Excellence - Journey',
        images: [
          {
            src: '/images/about/mou-signing.jpg',
            alt: 'AI CoE MoU Signing',
            caption: 'AI CoE MoU Signing – 29th June 2024'
          },
          {
            src: '/images/about/inauguration.jpg',
            alt: 'AI CoE Inauguration',
            caption: 'AI CoE Inauguration by Hon\'ble CM – 27th January 2025'
          }
        ],
        autoPlay: true,
        interval: 5000
      },
      {
        type: 'text',
        content: 'The Center of Excellence for IoT & AI emerged from a strategic partnership among MeitY, state governments, and Nasscom. Founded in July 2016, it marked a pivotal moment within India\'s Digital India Initiative, with a primary focus on democratizing innovation in Internet of Things and AI technologies.'
      },
      {
        type: 'text',
        content: 'Our equipped labs have facilitated the development of prototypes and solutions by startups, tailored specifically to sectors vital for India\'s progress, particularly healthcare and manufacturing. Over the years, we\'ve built unique capabilities to accelerate startups by working with industries and PSUs for successful use case solution development and deployment.'
      },
      {
        type: 'stats',
        items: [
          { label: 'Enterprises Engaged', value: '160+' },
          { label: 'Startups Cocreated With', value: '500+' },
          { label: 'Prototypes Developed', value: '200+' },
          { label: 'Successful Deployments', value: '50+' }
        ]
      },
      {
        type: 'locations',
        items: [
          {
            city: 'Gandhinagar',
            state: 'Gujarat',
            location: 'GIFT City',
            highlight: 'AI COE - Inaugurated Jan 2025'
          },
          {
            city: 'Bangalore',
            state: 'Karnataka',
            location: 'Tech Hub',
            highlight: 'IoT Innovation Center'
          },
          {
            city: 'Gurugram',
            state: 'Haryana',
            location: 'NCR Region',
            highlight: 'Enterprise Connect Hub'
          },
          {
            city: 'Vizag',
            state: 'Andhra Pradesh',
            location: 'Eastern Coast',
            highlight: 'Regional Innovation Center'
          }
        ]
      },
      {
        type: 'achievements',
        title: 'Phase 1 Achievements (2016-2024)',
        items: [
          'Labs operating at close to full occupancy across all locations',
          'Built robust industry connections with over 1,000 enterprises including SMEs',
          'Global showcase for India\'s technological innovations to international visitors',
          'Pioneering thought leadership with over 300 events & workshops hosted',
          'Societal impact through initiatives like Jan Care for public good'
        ]
      },
      {
        type: 'text',
        content: 'After completing our successful first 5-year phase, Nasscom signed an MoU with Gujarat Informatics Limited, Department of Science and Technology, and Government of Gujarat to establish the AI Center of Excellence at GIFT City, Gandhinagar. The AI COE focuses on sector-specific AI use case development, pilot projects, training for government officials, secure data exchange, and AI model adoption across government departments, private sectors, and MSMEs.'
      },
      {
        type: 'text',
        content: 'The AI COE was inaugurated by the Honourable Chief Minister of Gujarat on 27th January 2025, marking a new chapter in India\'s AI innovation journey.'
      }
    ]
  },

  aiChallenge: {
    id: 'aiChallenge',
    title: 'AI Innovation Challenge',
    subtitle: 'Connecting India\'s Best Startups with Real-World Challenges',
    summary: 'Along with the AI COE inauguration, the Honourable Chief Minister of Gujarat launched the AI Innovation Challenge to connect India\'s leading AI and deep-tech startups with real-world challenges from public and private sectors.',
    sections: [
      {
        type: 'carousel',
        title: 'AI Innovation Challenge Launch',
        images: [
          {
            src: '/images/ai-challenge/launch-event.jpg',
            alt: 'Launch of AI Innovation Challenge',
            caption: 'Launch of AI Innovation Challenge – 27th January 2025'
          },
          {
            src: '/images/ai-challenge/cm-interaction-1.jpg',
            alt: 'CM interacting with deep tech startups',
            caption: 'Hon\'ble CM Shri Bhupendrabhai Patel interacting with deep tech startups'
          },
          {
            src: '/images/ai-challenge/cm-interaction-2.jpg',
            alt: 'CM reviewing AI solutions',
            caption: 'Hon\'ble CM reviewing AI solutions during the launch event'
          }
        ],
        autoPlay: true,
        interval: 5000
      },
      {
        type: 'text',
        content: 'The AI Innovation Challenge (AI-IC) provides a unique opportunity for India\'s leading AI and deep-tech startups to showcase their cutting-edge solutions, collaborate with key stakeholders, and create meaningful impact in agriculture, healthcare, manufacturing, governance, and beyond.'
      },
      {
        type: 'text',
        content: 'By focusing on structured collaboration and outcome-focused innovation, AI-IC creates the necessary conditions for scalable AI adoption. For government, it enables more responsive governance. For industry, it offers a competitive edge through smarter operations. For startups, it becomes a proving ground with direct access to implementation opportunities.'
      },
      {
        type: 'list',
        title: 'Target Sectors',
        items: [
          '🌾 Agriculture - Smart farming, crop monitoring, quality assessment',
          '🏥 Healthcare - Medical imaging, diagnostics, patient monitoring',
          '⚙️ Manufacturing - Quality inspection, predictive maintenance, automation',
          '🏛️ Governance - Public services, citizen engagement, smart governance',
          'Additional sectors including education, transportation, and more'
        ]
      },
      {
        type: 'text',
        content: 'The platform is promoted through AI COE, DST, and GIL websites and social media, encouraging startups to apply with their innovation solutions to address real-world use cases.'
      },
      {
        type: 'criteria',
        title: 'Eligibility Criteria for Startups',
        items: [
          'Innovators and Mature Startups across the Nation',
          'Deep-tech capabilities and Market-ready Digital Solutions',
          'Annual turnover not exceeding ₹25 crore',
          'Period of existence not exceeding 10 years from Date of Incorporation',
          'Total manpower not more than 100 employees'
        ]
      },
      {
        type: 'text',
        content: 'Applications from startups are reviewed for selection to provide solutions and develop Proof of Concepts (PoCs) for the use cases. For more information, visit: https://gujarat.coe-iot.com/ai-coe-ai-innovation-challenge/'
      }
    ]
  },

  growx: {
    id: 'growx',
    title: 'GrowX Acceleration Program',
    subtitle: 'Complete Startup Acceleration Ecosystem',
    summary: 'GrowX is COE flagship acceleration program that runs to accelerate deep tech startups. It provides comprehensive support including Computing Infrastructure, Co-Working Space, AI Experience Zone, GTM Support, Funding up to 25 lakhs rupees, Mentorship, and Solution Showcase Opportunities.',
    sections: [
      {
        type: 'carousel',
        title: 'GrowX Facilities & Masterclasses',
        images: [
          {
            src: '/images/startups/coworking-space-1.jpg',
            alt: 'AI CoE Coworking Space',
            caption: 'AI CoE – Coworking Space for Deep Tech Startups'
          },
          {
            src: '/images/startups/masterclass-funding.jpg',
            alt: 'Masterclass on Fundraising',
            caption: 'Masterclass: How to raise Funding by Mihir Joshi, MD, GVFL'
          },
          {
            src: '/images/startups/masterclass-scalable-ai.jpg',
            alt: 'Masterclass on Scalable AI',
            caption: 'Masterclass: How to build scalable AI solutions by Ajay Barun, Microsoft'
          }
        ],
        autoPlay: true,
        interval: 5000
      },
      {
        type: 'text',
        content: 'GrowX provides various benefits to accelerate deep tech startups, including state-of-the-art computing infrastructure, co-working spaces, AI experience zones, go-to-market support, funding assistance, expert mentorship, and solution showcase opportunities.'
      },
      {
        type: 'benefits',
        title: 'Complete Acceleration Ecosystem',
        items: [
          '🖥️ Computing Infrastructure - AI/ML labs with V100 GPUs and advanced hardware',
          '🏢 Co-Working Space - Modern facilities and collaborative environment',
          'AI Experience Zone - Showcase and demo cutting-edge solutions',
          '📈 Go-To-Market Support - Business development and market entry assistance',
          '💰 Funding Support - Up to ₹25 lakhs for product development and scaling',
          '👥 Expert Mentorship - Panel of industry veterans and domain experts',
          'Solution Showcase - Opportunities at events, expos, and industry gatherings'
        ]
      },
      {
        type: 'text',
        content: 'COE conducts Innovation masterclasses for startups to educate themselves on critical subjects including Intellectual Property Rights, Investment Funding, Cloud Computing, Product-Market Fit, Design Validation, and more.'
      },
      {
        type: 'text',
        content: 'We are building a comprehensive panel of mentors who can guide startups through their entire growth journey - from product-market fit and design validation to fund raising, valuation assessment, market reach strategies, and scaling operations. Mentor details are hosted on our website for startups to request personalized sessions.'
      }
    ]
  },

  successStories: {
    id: 'successStories',
    title: 'Success Stories',
    subtitle: 'AI-Powered Grain Quality Assessment',
    summary: 'Our flagship success: AI-powered grain quality inspection system deployed at APMCs in Gujarat, empowering 1000+ farmers and facilitating ₹700+ crore grain trade.',
    sections: [
      {
        type: 'carousel',
        title: 'AI Solutions in Action',
        images: [
          {
            src: '/images/experience-zone/grain-quality-inspection.jpg',
            alt: 'AI Grain Quality Inspection System',
            caption: 'AI-powered Grain Quality Assessment by Upjao Agrotech - Deployed at APMCs in Gujarat'
          }
        ],
        autoPlay: false
      },
      {
        type: 'case-study',
        title: 'AI Grain Quality Assessment',
        problem: 'Grain quality evaluation relies on manual and subjective inspection, leading to inconsistent results, lack of transparency, and unfair pricing for farmers.',
        solution: 'AI-based grain quality assessment system capable of evaluating over ten physical parameters of grains (broken grains, foreign materials etc.) within 30 seconds using computer vision.',
        impact: [
          'Deployed at APMCs in Kheda and Anand in Gujarat',
          'Empowered over 1,000 farmers',
          'Facilitated grain trade worth ₹700+ crore',
          'Ensures fair pricing and reduces losses from rejections'
        ]
      },
      {
        type: 'stats',
        items: [
          { label: 'Farmers Empowered', value: '1000+' },
          { label: 'Trade Value', value: '₹700+ Cr' },
          { label: 'Evaluation Time', value: '30 sec' },
          { label: 'Parameters Checked', value: '10+' }
        ]
      }
    ]
  },

  experienceZone: {
    id: 'experienceZone',
    title: 'AI Experience Zone',
    subtitle: 'Cutting-Edge AI Solutions Showcase',
    summary: 'Our AI Experience Zone houses cutting edge AI solutions made by deep tech startups, showcasing real world applications of AI in Healthcare, Manufacturing, Agriculture, and Safety.',
    sections: [
      {
        type: 'carousel',
        title: 'AI Solutions on Display',
        images: [
          {
            src: '/images/experience-zone/dst-secretary-visit.jpg',
            alt: 'Secretary DST visit',
            caption: 'Visit by Smt. P. Bharathi, IAS, Secretary DST, Gujarat reviewing demos at Experience Zone'
          },
          {
            src: '/images/experience-zone/grain-quality-inspection.jpg',
            alt: 'AI-powered Grain Quality Inspection',
            caption: 'AI-powered Grain Quality Inspection by Upjao Agrotech'
          },
          {
            src: '/images/experience-zone/forus-healthcare-demo.jpg',
            alt: 'Forus Healthcare Demo',
            caption: 'AI-powered Healthcare Solutions demonstration'
          },
          {
            src: '/images/experience-zone/medical-device-demo.jpg',
            alt: 'Medical Device Demo',
            caption: 'Real-time vital monitoring and medical AI solutions'
          },
          {
            src: '/images/experience-zone/jivi-kiosk.jpg',
            alt: 'JIVI Health Kiosk',
            caption: 'AI-powered clinical platform for patient engagement'
          }
        ],
        autoPlay: true,
        interval: 5000
      },
      {
        type: 'sectors',
        title: 'Solution Areas',
        items: [
          {
            icon: '🏥',
            name: 'Healthcare',
            solutions: ['Medical Imaging Analysis', 'Patient Monitoring Systems', 'AI Diagnostics']
          },
          {
            icon: '⚙️',
            name: 'Manufacturing',
            solutions: ['AI Quality Inspection', 'Predictive Maintenance', 'IoT Machine Monitoring']
          },
          {
            icon: '🌾',
            name: 'Agriculture',
            solutions: ['Grain Quality Assessment', 'Crop Monitoring', 'Smart Farming IoT']
          },
          {
            icon: '🛡️',
            name: 'Safety',
            solutions: ['Video Analytics', 'Anomaly Detection', 'Smart Surveillance']
          }
        ]
      },
      {
        type: 'text',
        content: 'The zone is used to make industries, govt. officials, MSMEs and other stakeholders aware about real world applications of AI in different sectors.'
      }
    ]
  },

  governmentInitiatives: {
    id: 'governmentInitiatives',
    title: 'Government AI Initiatives',
    subtitle: 'Empowering Public Services with AI',
    summary: 'AI COE conducts workshops and training sessions for government officials to demonstrate AI applications in public services and governance.',
    sections: [
      {
        type: 'carousel',
        title: 'Government Engagement',
        images: [
          {
            src: '/images/government/govt-workshop-1.jpg',
            alt: 'Workshop for Government Officials',
            caption: 'Workshop for Govt. officials at Sachivalaya'
          },
          {
            src: '/images/government/govt-workshop-2.jpg',
            alt: 'AI Solutions Demo',
            caption: 'Demos of AI solutions for public services'
          }
        ],
        autoPlay: true,
        interval: 5000
      },
      {
        type: 'text',
        content: 'The AI COE conducts specialized workshops for government officials to showcase AI applications in public services. These sessions include hands-on demonstrations of AI solutions for governance, citizen services, and administrative efficiency.'
      },
      {
        type: 'list',
        title: 'Key Focus Areas',
        items: [
          'AI for Smart Governance',
          'Public Service Automation',
          'Citizen Engagement Platforms',
          'Data-driven Policy Making',
          'Administrative Process Optimization'
        ]
      }
    ]
  },

  industry: {
    id: 'industry',
    title: 'Industry Digitalization',
    subtitle: 'Smart Manufacturing for MSMEs',
    summary: 'AI COE makes significant efforts to digitalize MSMEs with Industry 4.0 and smart manufacturing solutions including IoT machine monitoring, AI quality inspection, and QR code-based inventory tracking.',
    sections: [
      {
        type: 'text',
        content: 'AI COE makes significant efforts to digitalize the MSMEs with Industry 4.0 and smart manufacturing solutions.'
      },
      {
        type: 'solutions',
        title: 'Smart Solutions',
        items: [
          'IoT for Machine monitoring',
          'AI for Quality inspection',
          'QR code-based track and trace of inventory'
        ]
      },
      {
        type: 'achievements',
        title: 'Impact',
        items: [
          'Educated over thousand MSMEs on adoption of smart solutions',
          'Partnered with Quality Council of India',
          'Conducted workshops in 12 different Industrial Clusters',
          'Part of Gujarat Gunvatta Yatra initiative',
          'Collaborated with Industry Associations: NPC, GCCI, GSPMA, SGCCI'
        ]
      }
    ]
  },

  incentives: {
    id: 'incentives',
    title: 'Gujarat IT/ITeS Policy Incentives',
    subtitle: 'Support for Deep Tech Startups',
    summary: 'Gujarat Government offers substantial incentives for Deep Tech Startups including R&D support (25% up to ₹25L), Patent assistance (75% up to ₹10L), Quality certification (50% up to ₹5L), and Cloud/Infrastructure support (35% up to ₹10L).',
    sections: [
      {
        type: 'incentives',
        title: 'Available Incentives',
        items: [
          {
            name: 'R&D, Prototype & Product Development',
            value: '25% up to ₹25 Lakhs',
            description: 'One time support for expenses on R&D, creating prototypes, and developing products'
          },
          {
            name: 'Patent Assistance',
            value: '75% up to ₹5L (Domestic) / ₹10L (International)',
            description: 'Maximum of 10 patents per year for five years. Includes Government and professional fees'
          },
          {
            name: 'Quality Certification',
            value: '50% up to ₹5 Lakhs per certificate',
            description: 'Subvention for up to three quality certifications'
          },
          {
            name: 'Cloud & Infrastructure',
            value: '35% up to ₹10 Lakhs',
            description: 'Support for internet bandwidth and cloud platform costs for 6 months'
          },
          {
            name: 'Lease Rental Support',
            value: '₹25/sq.ft or ₹1250/seat per month',
            description: 'Support for office space rental for five years'
          }
        ]
      }
    ]
  },

  location: {
    id: 'location',
    title: 'Our Locations',
    subtitle: '4 Strategic Centers Across India',
    summary: 'Nasscom COE operates from 4 strategic locations across India: Bangalore, Gurugram, Gandhinagar (GIFT City), and Vizag, serving as pivotal resources for entrepreneurs in emerging technologies.',
    sections: [
      {
        type: 'locations',
        items: [
          {
            city: 'Gandhinagar',
            state: 'Gujarat',
            location: 'GIFT City',
            highlight: 'AI COE - Inaugurated Jan 2025'
          },
          {
            city: 'Bangalore',
            state: 'Karnataka',
            location: 'Tech Hub',
            highlight: 'IoT Innovation Center'
          },
          {
            city: 'Gurugram',
            state: 'Haryana',
            location: 'NCR Region',
            highlight: 'Enterprise Connect Hub'
          },
          {
            city: 'Vizag',
            state: 'Andhra Pradesh',
            location: 'Eastern Coast',
            highlight: 'Regional Innovation Center'
          }
        ]
      },
      {
        type: 'text',
        content: 'Each location is equipped with state-of-the-art labs, co-working spaces, and facilities to support startup growth and innovation.'
      }
    ]
  },

  startups: {
    id: 'startups',
    title: 'Incubated Startups',
    subtitle: '18 Deep Tech Startups Driving Innovation',
    summary: 'We have incubated 18 deep tech startups across healthcare, agriculture, manufacturing, and enterprise AI sectors.',
    sections: [
      {
        type: 'stats',
        items: [
          { label: 'Total Startups', value: '18' },
          { label: 'Healthcare', value: '3' },
          { label: 'Agriculture', value: '3' },
          { label: 'Manufacturing', value: '3' }
        ]
      },
      {
        type: 'startups-grid',
        items: [
          { name: 'Atomo Innovation', description: 'Indigenous AI-powered edge computing for industrial automation', category: 'Manufacturing' },
          { name: 'DocYantra', description: 'AI healthcare tools for clinical decisions', category: 'Healthcare' },
          { name: 'Upjao Agrotech', description: 'AI-powered grain quality assessment', category: 'Agriculture' },
          { name: 'Karma AI', description: 'Legal assistant for Police and Prosecutors', category: 'Legal Tech' },
          { name: 'HanuAI', description: 'AI road digitization platform', category: 'Transportation' },
          { name: 'YogiFi', description: 'Smart yoga mats with AI posture tracking', category: 'Healthcare' }
        ]
      }
    ]
  },

  indiaAI: {
    id: 'indiaAI',
    title: 'IndiaAI Mission',
    subtitle: 'National AI Ecosystem Development',
    summary: 'IndiaAI Mission aims to build a comprehensive AI ecosystem fostering innovation, democratizing computing access, and developing indigenous AI capabilities.',
    sections: [
      {
        type: 'text',
        content: 'The IndiaAI Mission aims to build a comprehensive ecosystem that fosters AI innovation by democratizing computing access, enhancing data quality, developing indigenous AI capabilities, attracting top AI talent, enabling industry collaboration, providing startup risk capital, ensuring socially impactful AI projects, and promoting ethical AI.'
      },
      {
        type: 'list',
        title: 'Seven Pillars of IndiaAI',
        items: [
          'IndiaAI Innovation Centre - Developing indigenous Large Multimodal Models',
          'IndiaAI Application Development - Scaling impactful AI solutions',
          'AIKosh Platform - Unified hub for datasets and models',
          'IndiaAI Compute Capacity - 10,000+ GPUs ecosystem',
          'IndiaAI Startup Financing - Streamlined funding access',
          'IndiaAI FutureSkills - AI education and labs in Tier 2/3 cities',
          'Safe & Trusted AI - Responsible AI frameworks and governance'
        ]
      },
      {
        type: 'text',
        content: 'India-AI Impact Summit 2026 will be the first-ever global AI summit hosted in the Global South, scheduled for February 19–20 in New Delhi.'
      }
    ]
  },

  useCases: {
    id: 'useCases',
    title: 'AI Innovation Challenge Use Cases',
    subtitle: '51 Real-World Implementation Opportunities',
    summary: 'The AI Innovation Challenge features 51 use cases across government, healthcare, manufacturing, and more.',
    sections: [
      {
        type: 'text',
        content: 'The AI Innovation Challenge provides opportunities for AI startups to solve real-world problems across multiple sectors including government, healthcare, manufacturing, logistics, and more.'
      },
      {
        type: 'stats',
        items: [
          { label: 'Total Use Cases', value: '51' },
          { label: 'Government Sector', value: '30+' },
          { label: 'Healthcare', value: '8' },
          { label: 'Manufacturing', value: '10+' }
        ]
      },
      {
        type: 'list',
        title: 'Featured Use Cases',
        items: [
          'Detection of Illegal Encroachment - Development Commissioner Office',
          'Visitor Tracing using Facial Recognition - GIL & DIT',
          'AI Based Emergency Call Analytics - Home Department',
          'Surgical Planning for Head & Neck Cancer - Max Healthcare',
          'AI Based Predictive Maintenance of EV Charging Stations - Charge Zone',
          'Employee Productivity using Chatbot Assistance - Tata Capital'
        ]
      }
    ]
  },

  policyDetails: {
    id: 'policyDetails',
    title: 'Gujarat IT/ITeS Policy 2022-27',
    subtitle: 'Comprehensive Deep Tech Support Framework',
    summary: 'Gujarat offers extensive incentives across CAPEX, OPEX, R&D, patents, and infrastructure for deep tech startups and enterprises.',
    sections: [
      {
        type: 'text',
        content: 'The Gujarat IT/ITeS Policy 2022-27 provides comprehensive support for ICT and deep tech ecosystem including startups, incubators, accelerators, data centers, and global capability centers.'
      },
      {
        type: 'incentives',
        title: 'Key Incentive Categories',
        items: [
          {
            name: 'Deep Tech Startup Support',
            value: 'Up to ₹25L R&D + ₹10L Patent',
            description: '25% R&D support, 75% patent assistance, quality certification, cloud support'
          },
          {
            name: 'Incubator Support',
            value: '₹25 Cr CAPEX + ₹10 Cr OPEX',
            description: 'Capital and operational support for ICT & deep tech incubators'
          },
          {
            name: 'Category I Enterprises',
            value: '₹50 Cr CAPEX + ₹20 Cr OPEX',
            description: 'For companies with GFCI < ₹250 Cr'
          },
          {
            name: 'Category II Enterprises',
            value: '₹200 Cr CAPEX + ₹40 Cr OPEX',
            description: 'For companies with GFCI ≥ ₹250 Cr or 500+ employees'
          }
        ]
      },
      {
        type: 'text',
        content: 'Deep tech subsectors (AI, IoT, AR/VR, Blockchain, Quantum Computing) receive one-third relaxation in eligibility criteria, making it easier for innovation-focused companies to access benefits.'
      }
    ]
  }
}

// Keyword mapping for query matching
const queryKeywords = {
  welcome: ['welcome', 'hello', 'hi', 'start', 'about you'],
  about: ['about', 'what is', 'tell me about', 'information', 'overview', 'history', 'inauguration', 'mou'],
  aiChallenge: ['challenge', 'innovation challenge', 'competition', 'apply', 'launch'],
  useCases: ['use case', 'use cases', 'problem', 'application', 'implementation'],
  growx: ['growx', 'program', 'acceleration', 'incubation', 'funding', 'mentorship', 'support', 'masterclass'],
  startups: ['startup', 'startups', 'incubated', 'company', 'companies', 'coworking'],
  indiaAI: ['indiaai', 'india ai', 'mission', 'pillar', 'pillars', 'summit'],
  successStories: ['success', 'story', 'impact', 'grain', 'farmer', 'achievement', 'case study'],
  experienceZone: ['experience', 'zone', 'demo', 'showcase', 'solutions', 'see', 'visit'],
  governmentInitiatives: ['government initiative', 'govt workshop', 'sachivalaya', 'public service', 'officials'],
  industry: ['industry', 'msme', 'manufacturing', 'digitalization', 'smart manufacturing'],
  incentives: ['incentive', 'subsidy', 'benefit', 'grant'],
  policyDetails: ['policy', 'government support', 'it policy', 'ites policy', 'gujarat policy'],
  location: ['location', 'where', 'address', 'office', 'center', 'city']
}

/**
 * Get content for a user query
 * @param {string} query - User's question or query
 * @returns {object} - Relevant content slide
 */
export function getContentForQuery(query) {
  if (!query || query.trim() === '') {
    return contentDatabase.welcome
  }

  const lowerQuery = query.toLowerCase()
  
  // Find best matching content
  let bestMatch = 'welcome'
  let maxScore = 0

  for (const [contentKey, keywords] of Object.entries(queryKeywords)) {
    let score = 0
    keywords.forEach(keyword => {
      if (lowerQuery.includes(keyword)) {
        score += keyword.length // Longer keywords get more weight
      }
    })
    
    if (score > maxScore) {
      maxScore = score
      bestMatch = contentKey
    }
  }

  return contentDatabase[bestMatch] || contentDatabase.welcome
}

/**
 * Get all available content
 * @returns {object} - All content in database
 */
export function getAllContent() {
  return contentDatabase
}

/**
 * Get content by ID
 * @param {string} id - Content ID
 * @returns {object} - Content object
 */
export function getContentById(id) {
  return contentDatabase[id] || contentDatabase.welcome
}

export function wantsSlide(text){
  const triggerWords=[
    "slide", "details", "more", "show", "information",
    "tell me about", "what is", "what are", "list",
    "explain", "describe", "display"
  ]
  const lower=text.toLowerCase()
  return triggerWords.some(w=>lower.includes(w))
}

/**
 * Convert RAG service response format to section-based format (like hardcoded content)
 * This ensures RAG content displays with the same visual style as hardcoded content
 */
export function convertRAGCardsToSections(ragContent) {
  if (!ragContent) {
    console.log('⚠️ convertRAGCardsToSections: No ragContent provided');
    return null;
  }

  console.log('🔄 Converting RAG content:', {
    has_cards: !!ragContent.cards,
    cards_count: ragContent.cards?.length || 0,
    has_items: !!ragContent.items,
    items_count: ragContent.items?.length || 0,
    has_display: !!ragContent.display,
    display_type: ragContent.display_type,
    title: ragContent.title,
    metadata_intent: ragContent.metadata?.intent,
    all_keys: Object.keys(ragContent)
  });

  // Handle both 'cards' and 'items' fields (RAG service uses different formats)
  // RAG service puts structured data in 'items' array (from 'slides' in response_generator)
  // Items might be nested: [{type: 'startups-grid', items: [...]}] or flat: [{name: '...', description: '...'}]
  let items = ragContent.cards || ragContent.items || [];
  const sections = [];

  console.log('📦 Items array:', {
    length: items.length,
    first_item: items[0],
    item_keys: items[0] ? Object.keys(items[0]) : [],
    first_item_type: items[0]?.type,
    first_item_has_items: !!items[0]?.items
  });

  // Check if items are nested (slides with their own items arrays)
  if (items.length > 0 && items[0]?.items && Array.isArray(items[0].items)) {
    console.log('📦 Detected nested items structure - flattening');
    // Flatten nested structure: extract items from each slide
    const flattenedItems = [];
    items.forEach(slide => {
      if (slide.items && Array.isArray(slide.items)) {
        // Add the slide type to each item for grouping
        slide.items.forEach(item => {
          flattenedItems.push({
            ...item,
            slide_type: slide.type || slide.title
          });
        });
      }
    });
    items = flattenedItems;
    console.log('📦 Flattened to', items.length, 'items');
  }

  // If we have structured items (from cards/items array)
  if (items.length > 0) {
    console.log('✅ Processing', items.length, 'structured items');
    // Group items by type for better organization
    const groupedItems = items.reduce((groups, item) => {
      // Use slide_type if available, otherwise item.type or visual_type
      const type = item.slide_type || item.type || item.visual_type || 'content';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
      return groups;
    }, {});

    // Convert each group to appropriate sections
    Object.entries(groupedItems).forEach(([itemType, itemGroup]) => {
      console.log(`📋 Processing item type: ${itemType} with ${itemGroup.length} items`);
      switch (itemType) {
        case 'startups-grid':
        case 'startup':
          // Convert startup items to benefits section
          sections.push({
            type: 'benefits',
            title: 'Incubated Startups',
            items: itemGroup.map(item => `${item.name || item.title}: ${item.description || ''}`.trim())
          });
          break;

        case 'usecases-grid':
        case 'use_case':
        case 'usecase':
          // Convert use case items to highlights
          sections.push({
            type: 'highlights',
            title: 'AI Innovation Challenge Use Cases',
            items: itemGroup.map(item => `${item.title || item.name}: ${item.description || item.content || ''}`.substring(0, 150))
          });
          break;

        case 'content':
        case 'content-cards':
        default:
          // Check if items look like use cases (have title, organization, description)
          const firstItem = itemGroup[0];
          if (firstItem && (firstItem.title || firstItem.name) && (firstItem.description || firstItem.content || firstItem.organization)) {
            // Likely use cases or structured content
            if (firstItem.organization || firstItem.nominatedBy) {
              // Use cases
              sections.push({
                type: 'highlights',
                title: 'AI Innovation Challenge Use Cases',
                items: itemGroup.map(item => {
                  const title = item.title || item.name || '';
                  const org = item.organization || item.nominatedBy || '';
                  const desc = item.description || item.content || '';
                  return `${title}${org ? ` (${org})` : ''}: ${desc}`.substring(0, 150);
                })
              });
            } else if (firstItem.name || firstItem.title) {
              // Likely general items - create highlights section
              // Don't assume it's startups - use generic title
              sections.push({
                type: 'highlights',
                title: null, // Let the main title extraction handle this
                items: itemGroup.map(item => {
                  const name = item.name || item.title || '';
                  const desc = item.description || item.content || '';
                  // Preserve markdown in the description
                  return `${name}: ${desc}`.trim();
                })
              });
            }
          } else {
            // Convert items to text sections - preserve markdown formatting
            // Group multiple items into a single text section with markdown formatting
            if (itemGroup.length > 1) {
              // Create a formatted list
              const formattedContent = itemGroup.map((item, idx) => {
                const title = item.title || item.name || `Item ${idx + 1}`;
                const content = item.description || item.content || '';
                return `${idx + 1}. **${title}**: ${content}`;
              }).join('\n\n');
              
              sections.push({
                type: 'text',
                content: formattedContent
              });
            } else {
              // Single item - create text section
              itemGroup.forEach(item => {
                const title = item.title || item.name || 'Information';
                const content = item.description || item.content || '';
                sections.push({
                  type: 'text',
                  content: content ? `**${title}**: ${content}` : title
                });
              });
            }
          }
          break;
      }
    });
  }

  // If we have display text but no structured items, parse the display text
  if (items.length === 0 && ragContent.display) {
    const displayText = ragContent.display;

    // Check if it looks like formatted startup information
    if (displayText.includes('startup') || displayText.includes('incubated') || displayText.match(/\d+\.\s*\*\*/)) {
      // Parse numbered startup list (format: "1. **Name**: Description")
      const startupMatches = displayText.match(/\d+\.\s*\*\*([^*]+)\*\*:\s*([^]*?)(?=\d+\.|$)/g);
      if (startupMatches && startupMatches.length > 0) {
        const startups = startupMatches.map(match => {
          const parts = match.split('**:');
          const name = parts[0].replace(/^\d+\.\s*\*\*/, '').trim();
          // Get description, removing sector info and extra newlines
          let description = parts[1] ? parts[1].trim() : '';
          // Remove "Sector: ..." lines
          description = description.replace(/Sector:\s*[^\n]+/gi, '').trim();
          // Remove extra newlines
          description = description.replace(/\n+/g, ' ').trim();
          return `${name}: ${description}`;
        });

        sections.push({
          type: 'benefits',
          title: 'Incubated Startups',
          items: startups
        });
      } else {
        // Try alternative parsing for startup lists
        const lines = displayText.split('\n').filter(line => line.trim());
        const startupLines = lines.filter(line => 
          line.match(/\d+\./) || line.includes('**') || 
          (line.includes('startup') && line.length > 20)
        );
        
        if (startupLines.length > 0) {
          const startups = startupLines.map(line => {
            // Clean up the line
            let cleaned = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
            return cleaned;
          }).filter(s => s.length > 10); // Only meaningful entries

          if (startups.length > 0) {
            sections.push({
              type: 'benefits',
              title: 'Incubated Startups',
              items: startups
            });
          }
        } else {
          // Fallback: split by double newlines and create text sections
          const paragraphs = displayText.split('\n\n').filter(p => p.trim());
          paragraphs.forEach(paragraph => {
            sections.push({
              type: 'text',
              content: paragraph.trim()
            });
          });
        }
      }
    } else {
      // Default text parsing - split by double newlines
      const paragraphs = displayText.split('\n\n').filter(p => p.trim());
      if (paragraphs.length > 0) {
        paragraphs.forEach(paragraph => {
          sections.push({
            type: 'text',
            content: paragraph.trim()
          });
        });
      } else {
        // If no double newlines, split by single newlines
        const lines = displayText.split('\n').filter(p => p.trim() && p.length > 20);
        lines.forEach(line => {
          sections.push({
            type: 'text',
            content: line.trim()
          });
        });
      }
    }
  }

  // If no sections were created, create a fallback
  if (sections.length === 0) {
    console.log('⚠️ No sections created, creating fallback text section');
    const fallbackText = ragContent.display || ragContent.spoken || 'Information retrieved from knowledge base';
    sections.push({
      type: 'text',
      content: fallbackText
    });
  }

  console.log('✅ Converter created', sections.length, 'sections:', sections.map(s => s.type));

  // Extract title from various possible sources
  // Priority: 1. RAG title (from display_structure or slide title), 2. Section titles, 3. Generic fallback
  let title = ragContent.title;
  
  // Check if items have a title (from nested slide structure)
  if (!title && items.length > 0) {
    // Check the original items array for slide titles
    const originalItems = ragContent.cards || ragContent.items || [];
    if (originalItems.length > 0 && originalItems[0]?.title) {
      title = originalItems[0].title;
      console.log('📌 Using title from slide:', title);
    }
  }
  
  // If no title from RAG, check if sections have meaningful titles
  if (!title && sections.length > 0) {
    // Use the first section's title if it's not generic
    const firstSectionTitle = sections[0].title;
    if (firstSectionTitle && firstSectionTitle !== 'Information' && firstSectionTitle !== null) {
      title = firstSectionTitle;
      console.log('📌 Using title from section:', title);
    }
  }
  
  // Only use metadata intent if we're VERY confident (don't infer from generic content)
  // Skip this - it causes incorrect titles for unrelated queries
  // if (!title && ragContent.metadata?.intent) { ... }
  
  // Final fallback - use generic title
  if (!title) {
    title = 'Information';
    console.log('📌 Using fallback title: Information');
  }
  
  console.log('✅ Final title determined:', title);

  // Extract subtitle
  let subtitle = ragContent.subtitle;
  if (!subtitle) {
    if (items.length > 0) {
      subtitle = `${items.length} ${items.length === 1 ? 'item' : 'items'} from Knowledge Base`;
    } else {
      subtitle = 'Generated from Knowledge Base';
    }
  }

  // Return in the same format as hardcoded content
  // IMPORTANT: Remove display_type so ContentPanel uses sections renderer instead of DynamicContentRenderer
  const converted = {
    id: ragContent.id || `rag-${Date.now()}`,
    title: title,
    subtitle: subtitle,
    summary: ragContent.display || (items.length > 0 ? items.map(item => item.title || item.name).join(', ') : 'Information from knowledge base'),
    sections: sections,
    // Keep original RAG metadata for debugging
    rag_metadata: ragContent.rag_metadata
  };

  // Explicitly remove display_type to ensure sections-based rendering
  delete converted.display_type;
  delete converted.cards;
  delete converted.items;

  console.log('✅ Converted content ready:', {
    title: converted.title,
    subtitle: converted.subtitle,
    sections_count: converted.sections.length,
    has_display_type: 'display_type' in converted, // Should be false
    sections_types: converted.sections.map(s => s.type)
  });

  return converted;
}

