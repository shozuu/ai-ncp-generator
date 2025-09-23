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
  const value = ncp[section]
  if (typeof value === 'string') {
    const content = value.trim()
    return (
      content &&
      content.toLowerCase() !== 'not provided' &&
      content.toLowerCase() !== 'n/a'
    )
  } else if (typeof value === 'object' && value !== null) {
    // For objects, check if any value is non-empty
    return Object.values(value).some(
      v =>
        (typeof v === 'string' &&
          v.trim() &&
          v.trim().toLowerCase() !== 'not provided' &&
          v.trim().toLowerCase() !== 'n/a') ||
        (Array.isArray(v) && v.length > 0)
    )
  }
  return false
}

/**
 * Check if a section has valid explanation content (updated for new structure)
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
    const levelContent = sectionExplanation[key]
    if (!levelContent || typeof levelContent !== 'object') return false

    // Check if it has summary and detailed structure
    const summary = levelContent.summary
    const detailed = levelContent.detailed

    return (
      (summary && typeof summary === 'string' && summary.trim().length > 10) ||
      (detailed && typeof detailed === 'string' && detailed.trim().length > 20)
    )
  })
}

/**
 * Get formatted explanation content for a specific section and level
 * @param {Object} explanation - The explanation object
 * @param {string} section - The section name
 * @param {string} levelKey - The level key
 * @param {string} contentType - Either 'summary' or 'detailed'
 * @returns {string|null} Formatted content or null
 */
export const getExplanationContent = (
  explanation,
  section,
  levelKey,
  contentType = 'summary'
) => {
  if (!explanation?.explanation?.[section]) {
    return null
  }

  const sectionExplanation = explanation.explanation[section]

  if (
    !sectionExplanation[levelKey] ||
    typeof sectionExplanation[levelKey] !== 'object'
  ) {
    return null
  }

  const content = sectionExplanation[levelKey][contentType]

  if (!content || typeof content !== 'string') {
    return null
  }

  // Convert newlines to HTML breaks for display
  return content.replace(/\n/g, '<br>')
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

/**
 * Parse and format NCP section content into structured display format
 * @param {string} content - Raw content from AI
 * @param {string} sectionType - Type of section (assessment, diagnosis, etc.)
 * @returns {Object} Formatted content structure
 */
export const parseNCPSectionContent = (content, sectionType) => {
  if (!content || typeof content !== 'string') {
    return { type: 'simple', content: [] }
  }

  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  switch (sectionType) {
    case 'assessment':
      return parseAssessmentContent(lines)
    case 'diagnosis':
      return parseDiagnosisContent(lines)
    case 'outcomes':
      return parseOutcomesContent(lines)
    case 'interventions':
    case 'rationale':
    case 'implementation':
      return parseStructuredListContent(lines)
    case 'evaluation':
      return parseEvaluationContent(lines)
    default:
      return { type: 'simple', content: lines }
  }
}

/**
 * Parse assessment content (subjective/objective structure)
 */
const parseAssessmentContent = lines => {
  const structure = {
    type: 'assessment',
    subjective: [],
    objective: [],
  }

  let currentSection = null

  for (const line of lines) {
    const lowerLine = line.toLowerCase()

    if (
      lowerLine.includes('subjective') ||
      lowerLine.includes('* subjective')
    ) {
      currentSection = 'subjective'
      continue
    } else if (
      lowerLine.includes('objective') ||
      lowerLine.includes('* objective')
    ) {
      currentSection = 'objective'
      continue
    }

    if (currentSection && line.startsWith('-')) {
      structure[currentSection].push(line.substring(1).trim())
    } else if (currentSection && line) {
      structure[currentSection].push(line)
    }
  }

  return structure
}

/**
 * Parse diagnosis content
 */
const parseDiagnosisContent = lines => {
  return {
    type: 'diagnosis',
    content: lines,
  }
}

/**
 * Parse outcomes/goals content
 */
const parseOutcomesContent = lines => {
  const structure = {
    type: 'outcomes',
    shortTerm: [],
    longTerm: [],
  }

  let currentType = null

  for (const line of lines) {
    const lowerLine = line.toLowerCase()

    if (lowerLine.includes('short') || lowerLine.includes('within')) {
      currentType = 'shortTerm'
      if (!lowerLine.startsWith('-')) {
        structure.shortTerm.push(line)
        continue
      }
    } else if (
      lowerLine.includes('long') ||
      lowerLine.includes('week') ||
      lowerLine.includes('month')
    ) {
      currentType = 'longTerm'
      if (!lowerLine.startsWith('-')) {
        structure.longTerm.push(line)
        continue
      }
    }

    if (currentType && line.startsWith('-')) {
      structure[currentType].push(line.substring(1).trim())
    } else if (currentType && line) {
      structure[currentType].push(line)
    } else if (!currentType && line) {
      // If no specific type detected, add to short term
      structure.shortTerm.push(line)
    }
  }

  return structure
}

/**
 * Parse structured list content (interventions, rationale, implementation)
 */
const parseStructuredListContent = lines => {
  const structure = {
    type: 'structured',
    independent: [],
    dependent: [],
    collaborative: [],
    general: [],
  }

  let currentType = 'general'

  for (const line of lines) {
    const lowerLine = line.toLowerCase()

    if (
      lowerLine.includes('* independent') ||
      lowerLine.includes('independent:')
    ) {
      currentType = 'independent'
      continue
    } else if (
      lowerLine.includes('* dependent') ||
      lowerLine.includes('dependent:')
    ) {
      currentType = 'dependent'
      continue
    } else if (
      lowerLine.includes('* collaborative') ||
      lowerLine.includes('collaborative:')
    ) {
      currentType = 'collaborative'
      continue
    }

    if (line.startsWith('-')) {
      structure[currentType].push(line.substring(1).trim())
    } else if (line.match(/^\d+\./)) {
      structure[currentType].push(line)
    } else if (line) {
      structure[currentType].push(line)
    }
  }

  return structure
}

/**
 * Parse evaluation content
 */
const parseEvaluationContent = lines => {
  const structure = {
    type: 'evaluation',
    shortTerm: [],
    longTerm: [],
  }

  let currentType = null

  for (const line of lines) {
    const lowerLine = line.toLowerCase()

    if (
      lowerLine.includes('short') ||
      (lowerLine.includes('after') && lowerLine.includes('hour'))
    ) {
      currentType = 'shortTerm'
      if (!lowerLine.startsWith('-')) {
        structure.shortTerm.push(line)
        continue
      }
    } else if (
      lowerLine.includes('long') ||
      lowerLine.includes('week') ||
      lowerLine.includes('month') ||
      lowerLine.includes('discharge')
    ) {
      currentType = 'longTerm'
      if (!lowerLine.startsWith('-')) {
        structure.longTerm.push(line)
        continue
      }
    }

    if (currentType && line.startsWith('-')) {
      structure[currentType].push(line.substring(1).trim())
    } else if (currentType && line) {
      structure[currentType].push(line)
    } else if (!currentType && line) {
      structure.shortTerm.push(line)
    }
  }

  return structure
}

/**
 * Format structured NCP content for display
 * @param {Object} structure - Parsed structure from parseNCPSectionContent
 * @returns {Array} Array of formatted display elements
 */
export const formatNCPForDisplay = structure => {
  if (!structure || !structure.type) {
    return []
  }

  switch (structure.type) {
    case 'assessment':
      return formatAssessmentDisplay(structure)
    case 'diagnosis':
      return formatDiagnosisDisplay(structure)
    case 'outcomes':
      return formatOutcomesDisplay(structure)
    case 'structured':
      return formatStructuredDisplay(structure)
    case 'evaluation':
      return formatEvaluationDisplay(structure)
    default:
      return structure.content || []
  }
}

const formatAssessmentDisplay = structure => {
  const display = []

  if (structure.subjective?.length > 0) {
    display.push({ type: 'header', content: 'Subjective Data:' })
    structure.subjective.forEach(item => {
      display.push({ type: 'bullet', content: item })
    })
  }

  if (structure.objective?.length > 0) {
    display.push({ type: 'header', content: 'Objective Data:' })
    structure.objective.forEach(item => {
      display.push({ type: 'bullet', content: item })
    })
  }

  return display
}

const formatDiagnosisDisplay = structure => {
  return structure.content.map(item => ({ type: 'text', content: item }))
}

const formatOutcomesDisplay = structure => {
  const display = []

  if (structure.shortTerm?.length > 0) {
    display.push({ type: 'header', content: 'Short-term Goals:' })
    structure.shortTerm.forEach(item => {
      display.push({ type: 'text', content: item })
    })
  }

  if (structure.longTerm?.length > 0) {
    display.push({ type: 'header', content: 'Long-term Goals:' })
    structure.longTerm.forEach(item => {
      display.push({ type: 'text', content: item })
    })
  }

  return display
}

const formatStructuredDisplay = structure => {
  const display = []

  if (structure.independent?.length > 0) {
    display.push({ type: 'subheader', content: 'Independent:' })
    structure.independent.forEach(item => {
      display.push({ type: 'bullet', content: item })
    })
  }

  if (structure.dependent?.length > 0) {
    display.push({ type: 'subheader', content: 'Dependent:' })
    structure.dependent.forEach(item => {
      display.push({ type: 'bullet', content: item })
    })
  }

  if (structure.collaborative?.length > 0) {
    display.push({ type: 'subheader', content: 'Collaborative:' })
    structure.collaborative.forEach(item => {
      display.push({ type: 'bullet', content: item })
    })
  }

  if (
    structure.general?.length > 0 &&
    structure.independent?.length === 0 &&
    structure.dependent?.length === 0 &&
    structure.collaborative?.length === 0
  ) {
    structure.general.forEach(item => {
      display.push({ type: 'text', content: item })
    })
  }

  return display
}

const formatEvaluationDisplay = structure => {
  const display = []

  if (structure.shortTerm?.length > 0) {
    display.push({ type: 'header', content: 'Short-term Goal Evaluation:' })
    structure.shortTerm.forEach(item => {
      display.push({ type: 'text', content: item })
    })
  }

  if (structure.longTerm?.length > 0) {
    display.push({ type: 'header', content: 'Long-term Goal Evaluation:' })
    structure.longTerm.forEach(item => {
      display.push({ type: 'text', content: item })
    })
  }

  return display
}

/**
 * Convert formatted display data back to raw text for export
 * @param {Array} formattedData - Array of formatted display items
 * @returns {string} Raw text representation
 */
export const convertFormattedToRawText = formattedData => {
  if (!formattedData || !Array.isArray(formattedData)) {
    return ''
  }

  return formattedData
    .map(item => {
      if (typeof item === 'string') {
        return item
      } else if (item && typeof item === 'object' && item.content) {
        // Handle formatted objects with type and content
        switch (item.type) {
          case 'header':
            return `* ${item.content}:`
          case 'subheader':
            return `* ${item.content}:`
          case 'bullet':
            return `- ${item.content}`
          case 'text':
          default:
            return item.content
        }
      }
      return ''
    })
    .filter(line => line.trim().length > 0)
    .join('\n')
}

/**
 * Generate format options for NCP display
 * @param {Array} allColumns - Array of all available columns
 * @returns {Array} Array of format options
 */
export const generateFormatOptions = allColumns => {
  const options = []
  for (let i = 4; i <= allColumns.length; i++) {
    options.push({
      value: i.toString(),
      label: `${i} Columns`,
      description: allColumns
        .slice(0, i)
        .map(col => col.label)
        .join(', '),
    })
  }
  return options
}

/**
 * Get export options configuration
 * @returns {Array} Array of export options
 */
export const getExportOptions = () => [
  {
    value: 'pdf',
    label: 'Export as PDF',
    description: 'Portable Document Format',
  },
  {
    value: 'xlsx',
    label: 'Export as Excel',
    description: 'Microsoft Excel spreadsheet',
  },
  {
    value: 'word',
    label: 'Export as Word',
    description: 'Microsoft Word document',
  },
  {
    value: 'png',
    label: 'Export as PNG',
    description: 'Portable Network Graphics image',
  },
]

/**
 * Get all available NCP columns
 * @returns {Array} Array of column definitions
 */
export const getAllNCPColumns = () => [
  { key: 'assessment', label: 'Assessment' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'outcomes', label: 'Outcomes' },
  { key: 'interventions', label: 'Interventions' },
  { key: 'rationale', label: 'Rationale' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'evaluation', label: 'Evaluation' },
]

/**
 * Get editable columns (excluding assessment)
 * @returns {Array} Array of editable column definitions
 */
export const getEditableColumns = () => [
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'outcomes', label: 'Outcomes' },
  { key: 'interventions', label: 'Interventions' },
  { key: 'rationale', label: 'Rationale' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'evaluation', label: 'Evaluation' },
]

/**
 * Generate a standard default title for new NCPs
 * @returns {string} Standard default title
 */
export const generateDefaultNCPTitle = () => {
  return 'Nursing Care Plan'
}

/**
 * Get display title with fallback to default
 * @param {Object} ncp - NCP object
 * @returns {string} Display title
 */
export const getDisplayTitle = ncp => {
  if (ncp.title && ncp.title.trim() && !isDateString(ncp.title)) {
    return ncp.title
  }
  return generateDefaultNCPTitle()
}

/**
 * Check if a string looks like a formatted date
 * @param {string} str - String to check
 * @returns {boolean} Whether the string appears to be a date
 */
const isDateString = str => {
  // Check for common date patterns like "2024-01-15", "Jan 15, 2024", etc.
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
    /^\w{3}\s+\d{1,2},\s+\d{4}/, // Jan 15, 2024
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, // ISO datetime
  ]

  return datePatterns.some(pattern => pattern.test(str.trim()))
}

/**
 * Prepare export data from NCP object
 * @param {Object} ncp - NCP object
 * @param {Array} columns - Selected columns for export
 * @param {Object} formattedNCP - Formatted NCP data
 * @returns {Object} Export-ready data
 */
export const prepareExportData = (ncp, columns, formattedNCP) => {
  const exportData = {}

  columns.forEach(column => {
    // Use original raw data from ncp if available
    if (ncp[column.key] && typeof ncp[column.key] === 'string') {
      exportData[column.key] = ncp[column.key]
    } else if (formattedNCP[column.key]) {
      // Convert formatted data back to raw text as fallback
      exportData[column.key] = convertFormattedToRawText(
        formattedNCP[column.key]
      )
    } else {
      exportData[column.key] = ''
    }
  })

  return {
    ...exportData,
    title: getDisplayTitle(ncp),
    is_modified: ncp.is_modified || false,
  }
}

/**
 * Check if NCP has placeholder columns
 * @param {Array} columns - Array of columns to check
 * @returns {boolean} Whether placeholder columns exist
 */
export const hasPlaceholderColumns = columns =>
  columns.some(column => ['implementation', 'evaluation'].includes(column.key))

/**
 * Text processing utilities
 */
export const truncateText = (text, maxLength = 120) => {
  if (!text) return 'Not provided'
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

/**
 * NCP completion percentage utility (kept for badges)
 */
export const getCompletionPercentage = ncp => {
  const sections = [
    'assessment',
    'diagnosis',
    'outcomes',
    'interventions',
    'rationale',
    'implementation',
    'evaluation',
  ]
  const completedSections = sections.filter(
    section => ncp[section] && ncp[section].trim()
  )
  return Math.round((completedSections.length / sections.length) * 100)
}

/**
 * Format-related utilities
 */
export const getFormatDisplayName = formatType => {
  const format = formatType || '7'
  return `${format}-Column Format`
}

export const getFormatShortName = formatType => {
  const format = formatType || '7'
  return `${format}-Col`
}

/**
 * Process section content for display
 * @param {Object} sectionContent - The section content object
 * @returns {Array} Processed content array
 */
export const processSectionContent = sectionContent => {
  if (!sectionContent) return ['Not provided']

  if (typeof sectionContent === 'string') {
    return sectionContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  // If it's an object, use the robust formatter
  const formatted = formatNCPForDisplay(sectionContent)
  if (Array.isArray(formatted) && formatted.length > 0) {
    // Convert to simple lines for display (headers, bullets, etc.)
    return formatted.map(item => {
      if (typeof item === 'string') return item
      if (item.type === 'header' || item.type === 'subheader')
        return item.content
      if (item.type === 'bullet') return '• ' + item.content
      if (item.type === 'text') return item.content
      return JSON.stringify(item)
    })
  }

  // Fallback
  return [JSON.stringify(sectionContent)]
}
