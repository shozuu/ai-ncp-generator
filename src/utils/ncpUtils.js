/**
 * NCP-related utility functions
 */

/**
 * Section icons mapping
 */
export const sectionIcons = {
  assessment: 'Stethoscope',
  diagnosis: 'Brain',
  outcomes: 'Target',
  interventions: 'ClipboardList',
  rationale: 'Lightbulb',
  implementation: 'CheckCircle',
  evaluation: 'RefreshCw',
}

/**
 * Section titles mapping
 */
export const sectionTitles = {
  assessment: 'Assessment',
  diagnosis: 'Nursing Diagnosis',
  outcomes: 'Outcomes/Goals',
  interventions: 'Interventions',
  rationale: 'Rationale',
  implementation: 'Implementation',
  evaluation: 'Evaluation',
}

/**
 * Explanation levels configuration
 */
export const explanationLevels = [
  {
    key: 'clinical_reasoning',
    title: 'Clinical Reasoning',
    icon: 'Brain',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    titleColor: 'text-blue-900 dark:text-blue-100',
    iconColor: 'text-blue-600 dark:text-blue-400',
    description: 'Why this clinical decision was made',
  },
  {
    key: 'evidence_based_support',
    title: 'Evidence-Based Support',
    icon: 'FileCheck',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    textColor: 'text-emerald-800 dark:text-emerald-200',
    titleColor: 'text-emerald-900 dark:text-emerald-100',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Research and guidelines supporting this approach',
  },
  {
    key: 'student_guidance',
    title: 'Student Guidance',
    icon: 'GraduationCap',
    bgColor: 'bg-violet-50 dark:bg-violet-950/20',
    borderColor: 'border-violet-200 dark:border-violet-800',
    textColor: 'text-violet-800 dark:text-violet-200',
    titleColor: 'text-violet-900 dark:text-violet-100',
    iconColor: 'text-violet-600 dark:text-violet-400',
    description: 'Step-by-step learning guidance for nursing students',
  },
]

/**
 * Loading messages for explanation generation
 */
export const loadingMessages = [
  'Analyzing NCP components...',
  'Generating educational explanations...',
  'Applying evidence-based reasoning...',
  'Creating student guidance...',
  'Finalizing explanations...',
]

/**
 * Format text into lines by splitting on newlines and filtering empty lines
 * @param {string} text - The text to format
 * @returns {string[]} Array of formatted lines
 */
export const formatTextToLines = text => {
  if (!text || typeof text !== 'string') return []
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

/**
 * Check if a section has meaningful content
 * @param {Object} ncp - The NCP object
 * @param {string} section - The section to check
 * @returns {boolean} Whether the section has content
 */
export const hasContent = (ncp, section) => {
  if (!ncp || !ncp[section]) return false
  const content = ncp[section].trim()
  return (
    content &&
    content.toLowerCase() !== 'not provided' &&
    content.toLowerCase() !== 'n/a'
  )
}

/**
 * Check if a section has valid explanation content
 * @param {Object} explanation - The explanation object
 * @param {string} section - The section to check
 * @returns {boolean} Whether the section has valid explanations
 */
export const hasValidSectionExplanation = (explanation, section) => {
  if (!explanation?.explanation?.[section]) {
    return false
  }

  const sectionExplanation = explanation.explanation[section]

  // Check if it's a properly structured explanation object
  if (typeof sectionExplanation !== 'object' || sectionExplanation === null) {
    return false
  }

  // Check if it has at least one of the required levels with meaningful content
  const requiredKeys = [
    'clinical_reasoning',
    'evidence_based_support',
    'student_guidance',
  ]

  return requiredKeys.some(key => {
    const content = sectionExplanation[key]
    return (
      content &&
      typeof content === 'string' &&
      content.trim().length > 10 && // Minimum meaningful content length
      !content.toLowerCase().includes('temporarily unavailable') &&
      !content.toLowerCase().includes('technical issue')
    )
  })
}

/**
 * Get formatted explanation content for a specific section and level
 * @param {Object} explanation - The explanation object
 * @param {string} section - The section name
 * @param {string} levelKey - The level key
 * @returns {string|null} Formatted content or null
 */
export const getExplanationContent = (explanation, section, levelKey) => {
  if (!explanation?.explanation?.[section]) {
    return null
  }

  const sectionExplanation = explanation.explanation[section]

  if (!levelKey || typeof levelKey !== 'string') {
    return null
  }

  const content = sectionExplanation[levelKey]

  if (!content || typeof content !== 'string') {
    return null
  }

  // Clean and format the content
  const cleanContent = content.trim()
  if (cleanContent.length === 0) return null

  // Format the text with better line breaks and emphasis
  return cleanContent
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

/**
 * Get available sections based on NCP format
 * @param {Object} ncp - The NCP object
 * @returns {string[]} Array of available section names
 */
export const getAvailableSections = ncp => {
  if (!ncp) return []

  const format = parseInt(ncp.format_type || '7')
  const allSections = [
    'assessment',
    'diagnosis',
    'outcomes',
    'interventions',
    'rationale',
    'implementation',
    'evaluation',
  ]
  return allSections.slice(0, format)
}

/**
 * Check if there are any valid explanations
 * @param {Object} explanation - The explanation object
 * @param {string[]} availableSections - Array of available sections
 * @returns {boolean} Whether there are any valid explanations
 */
export const hasAnyValidExplanations = (explanation, availableSections) => {
  if (!explanation?.explanation) return false

  return availableSections.some(section =>
    hasValidSectionExplanation(explanation, section)
  )
}
