/**
 * Structured NCP Utilities
 * Clean, simple utilities for handling the structured JSON NCP format from the backend
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
 * Check if a section has meaningful content
 * @param {Object} ncp - The NCP object
 * @param {string} section - The section to check
 * @returns {boolean} Whether the section has content
 */
export const hasContent = (ncp, section) => {
  if (!ncp || !ncp[section]) return false
  const content =
    typeof ncp[section] === 'string' ? ncp[section].trim() : ncp[section]
  return (
    content &&
    content !== 'Not provided' &&
    content !== 'N/A' &&
    content !== 'not provided' &&
    content !== 'n/a'
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
 * Get editable columns (all except assessment which comes from user input)
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
 * Format structured NCP data for display
 * Takes the JSON structure from backend and converts it to display-ready format
 */
export const formatStructuredNCPForDisplay = ncp => {
  if (!ncp) return {}

  const formatted = {}

  // Format Assessment
  if (ncp.assessment) {
    formatted.assessment = formatAssessmentSection(ncp.assessment)
  }

  // Format Diagnosis
  if (ncp.diagnosis) {
    formatted.diagnosis = formatDiagnosisSection(ncp.diagnosis)
  }

  // Format Outcomes
  if (ncp.outcomes) {
    formatted.outcomes = formatOutcomesSection(ncp.outcomes)
  }

  // Format Interventions
  if (ncp.interventions) {
    formatted.interventions = formatInterventionsSection(ncp.interventions)
  }

  // Format Rationale
  if (ncp.rationale) {
    formatted.rationale = formatRationaleSection(
      ncp.rationale,
      ncp.interventions
    )
  }

  // Format Implementation
  if (ncp.implementation) {
    formatted.implementation = formatImplementationSection(ncp.implementation)
  }

  // Format Evaluation
  if (ncp.evaluation) {
    formatted.evaluation = formatEvaluationSection(ncp.evaluation)
  }

  return formatted
}

/**
 * Format Assessment section
 */
const formatAssessmentSection = assessment => {
  const items = []

  if (assessment.subjective && assessment.subjective.length > 0) {
    items.push({
      type: 'subheading',
      content: 'Subjective',
      className: 'font-semibold text-blue-800 dark:text-blue-200 mb-2',
    })
    assessment.subjective.forEach(item => {
      items.push({
        type: 'bullet',
        content: item,
      })
    })
  }

  if (assessment.objective && assessment.objective.length > 0) {
    items.push({
      type: 'subheading',
      content: 'Objective',
      className: 'font-semibold text-green-800 dark:text-green-200 mb-2',
    })
    assessment.objective.forEach(item => {
      items.push({
        type: 'bullet',
        content: item,
      })
    })
  }

  return items
}

/**
 * Format Diagnosis section
 */
const formatDiagnosisSection = diagnosis => {
  return [
    {
      type: 'text',
      content: diagnosis.statement,
      className: 'font-normal',
    },
  ]
}

/**
 * Format Outcomes section
 */
const formatOutcomesSection = outcomes => {
  const items = []

  if (outcomes.short_term && outcomes.short_term.timeframes) {
    items.push({
      type: 'subheading',
      content: 'Short-term',
      className: 'font-semibold text-purple-800 dark:text-purple-200 mb-2',
    })

    Object.entries(outcomes.short_term.timeframes).forEach(
      ([timeframe, outcomeList]) => {
        items.push({
          type: 'timeframe',
          content: timeframe,
          className:
            'font-medium text-sm text-muted-foreground uppercase tracking-wide mt-2 mb-1',
        })
        outcomeList.forEach(outcome => {
          items.push({
            type: 'bullet',
            content: outcome,
          })
        })
      }
    )
  }

  if (outcomes.long_term && outcomes.long_term.timeframes) {
    items.push({
      type: 'subheading',
      content: 'Long-term',
      className: 'font-semibold text-purple-800 dark:text-purple-200 mb-2 mt-4',
    })

    Object.entries(outcomes.long_term.timeframes).forEach(
      ([timeframe, outcomeList]) => {
        items.push({
          type: 'timeframe',
          content: timeframe,
          className:
            'font-medium text-sm text-muted-foreground uppercase tracking-wide mt-2 mb-1',
        })
        outcomeList.forEach(outcome => {
          items.push({
            type: 'bullet',
            content: outcome,
          })
        })
      }
    )
  }

  return items
}

/**
 * Format Interventions section
 */
const formatInterventionsSection = interventions => {
  const items = []

  const categories = [
    {
      key: 'independent',
      label: 'Independent Interventions',
      color: 'text-emerald-800 dark:text-emerald-200',
    },
    {
      key: 'dependent',
      label: 'Dependent Interventions',
      color: 'text-orange-800 dark:text-orange-200',
    },
    {
      key: 'collaborative',
      label: 'Collaborative Interventions',
      color: 'text-blue-800 dark:text-blue-200',
    },
  ]

  categories.forEach(({ key, label, color }) => {
    if (
      interventions[key] &&
      Array.isArray(interventions[key]) &&
      interventions[key].length > 0
    ) {
      items.push({
        type: 'subheading',
        content: label,
        className: `font-semibold ${color} mb-2 ${items.length > 0 ? 'mt-4' : ''}`,
      })

      interventions[key].forEach(intervention => {
        items.push({
          type: 'numbered',
          content: intervention.intervention,
          id: intervention.id,
        })
      })
    }
  })

  return items
}

/**
 * Format Rationale section
 */
const formatRationaleSection = (rationale, interventions) => {
  const items = []

  if (rationale.interventions) {
    // Group rationales by intervention type
    const categories = [
      {
        key: 'independent',
        label: 'Independent Interventions',
        color: 'text-emerald-800 dark:text-emerald-200',
      },
      {
        key: 'dependent',
        label: 'Dependent Interventions',
        color: 'text-orange-800 dark:text-orange-200',
      },
      {
        key: 'collaborative',
        label: 'Collaborative Interventions',
        color: 'text-blue-800 dark:text-blue-200',
      },
    ]

    categories.forEach(({ key, label, color }) => {
      if (
        interventions &&
        interventions[key] &&
        Array.isArray(interventions[key])
      ) {
        const hasRationales = interventions[key].some(
          intervention => rationale.interventions[intervention.id]
        )

        if (hasRationales) {
          items.push({
            type: 'subheading',
            content: label,
            className: `font-semibold ${color} mb-2 ${items.length > 0 ? 'mt-4' : ''}`,
          })

          interventions[key].forEach(intervention => {
            const rationaleData = rationale.interventions[intervention.id]
            if (rationaleData) {
              items.push({
                type: 'rationale',
                intervention: intervention.intervention,
                rationale: rationaleData.rationale,
                evidence: rationaleData.evidence,
                id: intervention.id,
              })
            }
          })
        }
      }
    })
  }

  return items
}

/**
 * Format Implementation section
 */
const formatImplementationSection = implementation => {
  const items = []

  const categories = [
    {
      key: 'independent',
      label: 'Independent Actions',
      color: 'text-emerald-800 dark:text-emerald-200',
    },
    {
      key: 'dependent',
      label: 'Dependent Actions',
      color: 'text-orange-800 dark:text-orange-200',
    },
    {
      key: 'collaborative',
      label: 'Collaborative Actions',
      color: 'text-blue-800 dark:text-blue-200',
    },
  ]

  categories.forEach(({ key, label, color }) => {
    if (
      implementation[key] &&
      Array.isArray(implementation[key]) &&
      implementation[key].length > 0
    ) {
      items.push({
        type: 'subheading',
        content: label,
        className: `font-semibold ${color} mb-2 ${items.length > 0 ? 'mt-4' : ''}`,
      })

      implementation[key].forEach(action => {
        items.push({
          type: 'numbered',
          content: action.action_taken,
          id: action.id,
        })
      })
    }
  })

  return items
}

/**
 * Format Evaluation section
 */
const formatEvaluationSection = evaluation => {
  const items = []

  const timePeriods = ['short_term', 'long_term']
  const timePeriodLabels = {
    short_term: 'Short-Term Evaluation',
    long_term: 'Long-Term Evaluation',
  }

  timePeriods.forEach(period => {
    if (evaluation[period]) {
      const periodData = evaluation[period]
      const hasContent = Object.keys(periodData).some(
        status =>
          periodData[status] && Object.keys(periodData[status]).length > 0
      )

      if (hasContent) {
        items.push({
          type: 'subheading',
          content: timePeriodLabels[period],
          className: `font-semibold text-violet-800 dark:text-violet-200 mb-2 ${items.length > 0 ? 'mt-4' : ''}`,
        })

        const statuses = ['Met', 'Partially Met', 'Not Met']
        const statusColors = {
          Met: 'text-green-700 dark:text-green-300',
          'Partially Met': 'text-yellow-700 dark:text-yellow-300',
          'Not Met': 'text-red-700 dark:text-red-300',
        }

        statuses.forEach(status => {
          if (periodData[status]) {
            items.push({
              type: 'status',
              content: status,
              className: `font-medium ${statusColors[status]} mt-3 mb-1`,
            })

            Object.entries(periodData[status]).forEach(
              ([timeframe, evaluations]) => {
                items.push({
                  type: 'timeframe',
                  content: timeframe,
                  className:
                    'font-medium text-sm text-muted-foreground uppercase tracking-wide mt-2 mb-1',
                })

                evaluations.forEach(evaluation => {
                  items.push({
                    type: 'bullet',
                    content: evaluation,
                  })
                })
              }
            )
          }
        })
      }
    }
  })

  return items
}

/**
 * Check if columns have placeholder content
 */
export const hasPlaceholderColumns = columns => {
  return columns.some(col => col.isPlaceholder)
}

/**
 * Generate format options for display
 */
export const generateFormatOptions = allColumns => {
  return allColumns.map((_, index) => ({
    value: (index + 1).toString(),
    label: `${index + 1} Column${index !== 0 ? 's' : ''}`,
    description: `Display ${index + 1} column${index !== 0 ? 's' : ''} of the NCP`,
  }))
}

/**
 * Get display title for an NCP
 */
export const getDisplayTitle = ncp => {
  if (ncp?.title && ncp.title.trim() && !isDateString(ncp.title)) {
    return ncp.title
  }
  return generateDefaultNCPTitle()
}

/**
 * Generate a standard default title for new NCPs
 */
export const generateDefaultNCPTitle = () => {
  return 'Nursing Care Plan'
}

/**
 * Check if a string looks like a formatted date
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
 * Get format display names (for backward compatibility)
 */
export const getFormatDisplayName = formatValue => {
  const formats = {
    3: '3 Columns',
    4: '4 Columns',
    5: '5 Columns',
    6: '6 Columns',
    7: '7 Columns',
  }
  return formats[formatValue] || `${formatValue} Columns`
}

export const getFormatShortName = formatValue => {
  return `${formatValue}Col`
}

/**
 * Export options configuration
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
 * Prepare export data from structured NCP
 */
export const prepareExportData = (ncp, columns, formattedNCP) => {
  const exportData = {}

  columns.forEach(column => {
    if (formattedNCP[column.key]) {
      exportData[column.label] = convertFormattedToRawText(
        formattedNCP[column.key]
      )
    }
  })

  return exportData
}

/**
 * Convert formatted display items back to raw text for export
 */
const convertFormattedToRawText = formattedItems => {
  if (!Array.isArray(formattedItems)) return ''

  return formattedItems
    .map(item => {
      switch (item.type) {
        case 'subheading':
        case 'status':
        case 'timeframe':
          return `\n${item.content}\n`
        case 'bullet':
          return `• ${item.content}`
        case 'numbered':
          return `${formattedItems.filter(i => i.type === 'numbered').indexOf(item) + 1}. ${item.content}`
        case 'rationale':
          return `${item.intervention}\nRationale: ${item.rationale}\nEvidence: ${item.evidence}`
        case 'text':
        default:
          return item.content
      }
    })
    .join('\n')
}
