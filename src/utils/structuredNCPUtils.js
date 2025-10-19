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
    'diagnosis',
    'outcomes',
    'interventions',
    'rationale',
    'implementation',
    'evaluation',
  ]
  // Adjust format to account for removed assessment section
  return allSections.slice(0, format - 1)
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

  // Helper function to safely format sections
  const safeFormat = (section, formatter, sectionName) => {
    try {
      return formatter(section)
    } catch (error) {
      console.warn(`Error formatting ${sectionName} section:`, error)
      console.log(`${sectionName} data:`, section)
      // Return a fallback format
      return [
        {
          type: 'text',
          content: `Error displaying this section. Please try refreshing. Data: ${JSON.stringify(section)}`,
          className: 'text-destructive',
        },
      ]
    }
  }

  // Format Assessment
  if (ncp.assessment) {
    formatted.assessment = safeFormat(
      ncp.assessment,
      formatAssessmentSection,
      'assessment'
    )
  }

  // Format Diagnosis
  if (ncp.diagnosis) {
    formatted.diagnosis = safeFormat(
      ncp.diagnosis,
      formatDiagnosisSection,
      'diagnosis'
    )
  }

  // Format Outcomes
  if (ncp.outcomes) {
    formatted.outcomes = safeFormat(
      ncp.outcomes,
      formatOutcomesSection,
      'outcomes'
    )
  }

  // Format Interventions
  if (ncp.interventions) {
    formatted.interventions = safeFormat(
      ncp.interventions,
      formatInterventionsSection,
      'interventions'
    )
  }

  // Format Rationale - with error recovery
  if (ncp.rationale) {
    try {
      const rationaleItems = formatRationaleSection(
        ncp.rationale,
        ncp.interventions
      )

      // Extra check: if no items were formatted but rationale exists,
      // try to display it as raw content
      if (rationaleItems.length === 0 && ncp.rationale) {
        // Try to extract any meaningful content from the rationale object
        if (typeof ncp.rationale === 'string' && ncp.rationale.trim()) {
          rationaleItems.push({
            type: 'text',
            content: ncp.rationale.trim(),
          })
        } else if (
          typeof ncp.rationale === 'object' &&
          ncp.rationale !== null
        ) {
          // Show the raw JSON as a fallback if nothing else works
          rationaleItems.push({
            type: 'text',
            content:
              'Rationale data could not be formatted properly. Please edit this section to fix the display.',
            className: 'text-muted-foreground text-xs mb-2',
          })
          rationaleItems.push({
            type: 'text',
            content: JSON.stringify(ncp.rationale, null, 2),
            className: 'font-mono text-xs bg-muted p-2 rounded',
          })
        }
      }

      formatted.rationale = rationaleItems
    } catch (error) {
      console.error('Error formatting rationale section:', error)

      // Fallback: show error message and raw data
      formatted.rationale = [
        {
          type: 'text',
          content:
            'Error displaying rationale section. Please edit this section to fix the display.',
          className: 'text-destructive text-sm mb-2',
        },
        {
          type: 'text',
          content: JSON.stringify(ncp.rationale, null, 2),
          className: 'font-mono text-xs bg-muted p-2 rounded',
        },
      ]
    }
  }

  // Format Implementation
  if (ncp.implementation) {
    formatted.implementation = safeFormat(
      ncp.implementation,
      formatImplementationSection,
      'implementation'
    )
  }

  // Format Evaluation
  if (ncp.evaluation) {
    formatted.evaluation = safeFormat(
      ncp.evaluation,
      formatEvaluationSection,
      'evaluation'
    )
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
      className: 'font-semibold text-xs mb-2',
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
      className: 'font-semibold text-xs mb-2',
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

  // Check if outcomes is a string (plain text format) and handle it
  if (typeof outcomes === 'string') {
    // Parse plain text outcomes
    const lines = outcomes
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    let currentSection = null

    lines.forEach(line => {
      const lowerLine = line.toLowerCase()

      if (lowerLine.includes('short') && lowerLine.includes('term')) {
        currentSection = 'short'
        items.push({
          type: 'subheading',
          content: 'Short-term',
          className: 'font-semibold text-xs mb-2',
        })
      } else if (lowerLine.includes('long') && lowerLine.includes('term')) {
        currentSection = 'long'
        items.push({
          type: 'subheading',
          content: 'Long-term',
          className: 'font-semibold text-xs mb-2 mt-4',
        })
      } else if (line.startsWith('-') || line.startsWith('*')) {
        items.push({
          type: 'bullet',
          content: line.replace(/^[-*]\s*/, ''),
        })
      } else if (line && currentSection) {
        items.push({
          type: 'text',
          content: line,
        })
      }
    })

    return items
  }

  // Helper function to process timeframes (handles multiple data structures)
  const processTimeframes = timeframesData => {
    if (!timeframesData) return []

    const items = []

    // Structure 1: timeframes is an array of objects with timeframe and outcomes properties
    // Example: [{ timeframe: "Within 1 hour", outcomes: [...] }, ...]
    if (Array.isArray(timeframesData)) {
      timeframesData.forEach((timeframeObj, index) => {
        if (timeframeObj && typeof timeframeObj === 'object') {
          const timeframeLabel =
            timeframeObj.timeframe || `Timeframe ${index + 1}`
          const outcomes = timeframeObj.outcomes || []

          items.push({
            type: 'timeframe',
            content: timeframeLabel,
            className:
              'font-medium text-sm text-muted-foreground tracking-wide mt-2 mb-1',
          })

          if (Array.isArray(outcomes)) {
            outcomes.forEach(outcome => {
              if (outcome && typeof outcome === 'string') {
                items.push({
                  type: 'bullet',
                  content: outcome,
                })
              }
            })
          }
        }
      })
    }
    // Structure 2: timeframes is an object with numeric string keys
    // Example: { "0": { timeframe: "Within 1 hour", outcomes: [...] }, "1": {...} }
    else if (typeof timeframesData === 'object') {
      const keys = Object.keys(timeframesData)

      // Check if keys are numeric (Structure 2)
      const areNumericKeys = keys.every(key => !isNaN(key))

      if (areNumericKeys) {
        Object.values(timeframesData).forEach((timeframeObj, index) => {
          if (timeframeObj && typeof timeframeObj === 'object') {
            const timeframeLabel =
              timeframeObj.timeframe || `Timeframe ${index + 1}`
            const outcomes = timeframeObj.outcomes || []

            items.push({
              type: 'timeframe',
              content: timeframeLabel,
              className:
                'font-medium text-sm text-muted-foreground tracking-wide mt-2 mb-1',
            })

            if (Array.isArray(outcomes)) {
              outcomes.forEach(outcome => {
                if (outcome && typeof outcome === 'string') {
                  items.push({
                    type: 'bullet',
                    content: outcome,
                  })
                }
              })
            }
          }
        })
      } else {
        // Structure 3: timeframes is an object with timeframe names as keys
        // Example: { "Within 1 hour": [...], "Within 4 hours": [...] }
        Object.entries(timeframesData).forEach(([timeframeLabel, outcomes]) => {
          items.push({
            type: 'timeframe',
            content: timeframeLabel,
            className:
              'font-medium text-sm text-muted-foreground tracking-wide mt-2 mb-1',
          })

          if (Array.isArray(outcomes)) {
            outcomes.forEach(outcome => {
              if (outcome && typeof outcome === 'string') {
                items.push({
                  type: 'bullet',
                  content: outcome,
                })
              }
            })
          }
        })
      }
    }
    return items
  }

  // Handle structured format
  if (outcomes.short_term && outcomes.short_term.timeframes) {
    items.push({
      type: 'subheading',
      content: 'Short-term',
      className: 'font-semibold text-xs mb-2',
    })

    const shortTermItems = processTimeframes(
      outcomes.short_term.timeframes,
      'short-term'
    )
    items.push(...shortTermItems)
  }

  if (outcomes.long_term && outcomes.long_term.timeframes) {
    items.push({
      type: 'subheading',
      content: 'Long-term',
      className: 'font-semibold text-xs mb-2 mt-4',
    })

    const longTermItems = processTimeframes(
      outcomes.long_term.timeframes,
      'long-term'
    )
    items.push(...longTermItems)
  }

  // Fallback: if no items were added but outcomes exist, try to process as a generic object
  if (items.length === 0 && outcomes && typeof outcomes === 'object') {
    // Try to find outcome arrays in the structure
    const findOutcomesRecursively = (obj, prefix = '') => {
      const foundItems = []

      Object.entries(obj).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          // Check if this looks like an outcomes array
          const isOutcomeArray = value.every(item => typeof item === 'string')
          if (isOutcomeArray) {
            foundItems.push({
              type: 'subheading',
              content: prefix ? `${prefix} - ${key}` : key,
              className: 'font-semibold text-xs mb-2 mt-2',
            })

            value.forEach(outcome => {
              foundItems.push({
                type: 'bullet',
                content: outcome,
              })
            })
          }
        } else if (typeof value === 'object' && value !== null) {
          const nestedItems = findOutcomesRecursively(value, key)
          foundItems.push(...nestedItems)
        }
      })

      return foundItems
    }

    const fallbackItems = findOutcomesRecursively(outcomes)
    items.push(...fallbackItems)
  }

  return items
}

/**
 * Format Interventions section
 */
const formatInterventionsSection = interventions => {
  const items = []

  // Helper function to safely process intervention lists
  const processInterventionList = interventionList => {
    if (!interventionList) return []

    if (Array.isArray(interventionList)) {
      return interventionList
    } else if (typeof interventionList === 'string') {
      // Split by newlines and create intervention objects
      return interventionList
        .split('\n')
        .map((item, index) => ({
          intervention: item.trim(),
          id: `manual_${index}`,
        }))
        .filter(item => item.intervention.length > 0)
    } else if (typeof interventionList === 'object') {
      // Try to convert object to array format
      return Object.entries(interventionList).map(([key, value], index) => ({
        intervention: typeof value === 'string' ? value : `${key}: ${value}`,
        id: `obj_${index}`,
      }))
    }

    return []
  }

  const categories = [
    {
      key: 'independent',
      label: 'Independent Interventions',
    },
    {
      key: 'dependent',
      label: 'Dependent Interventions',
    },
    {
      key: 'collaborative',
      label: 'Collaborative Interventions',
    },
  ]

  categories.forEach(({ key, label, color }) => {
    const interventionList = interventions[key]
    const processedInterventions = processInterventionList(interventionList)

    if (processedInterventions.length > 0) {
      items.push({
        type: 'subheading',
        content: label,
        className: `font-semibold text-xs ${color} mb-2 ${items.length > 0 ? 'mt-4' : ''}`,
      })

      processedInterventions.forEach(intervention => {
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

  if (!rationale) {
    return items
  }

  // Handle rationale.interventions structure
  if (rationale.interventions && typeof rationale.interventions === 'object') {
    // Group rationales by intervention type
    const categories = [
      {
        key: 'independent',
        label: 'Independent Interventions',
      },
      {
        key: 'dependent',
        label: 'Dependent Interventions',
      },
      {
        key: 'collaborative',
        label: 'Collaborative Interventions',
      },
    ]

    let hasAnyRationales = false

    categories.forEach(({ key, label, color }) => {
      let categoryHasRationales = false
      const categoryItems = []

      if (
        interventions &&
        interventions[key] &&
        Array.isArray(interventions[key])
      ) {
        // Try to match rationales with interventions by ID
        interventions[key].forEach(intervention => {
          const rationaleData = rationale.interventions[intervention.id]
          if (rationaleData) {
            categoryItems.push({
              type: 'rationale',
              intervention: intervention.intervention,
              rationale: rationaleData.rationale,
              evidence: rationaleData.evidence,
              id: intervention.id,
            })
            categoryHasRationales = true
          }
        })
      }

      // If no matches found but rationales exist for this category, show them anyway
      if (!categoryHasRationales) {
        Object.entries(rationale.interventions).forEach(
          ([id, rationaleData]) => {
            // Check if this rationale ID might belong to this category
            if (
              id.toLowerCase().includes(key) ||
              (key === 'independent' &&
                !id.toLowerCase().includes('dependent') &&
                !id.toLowerCase().includes('collaborative')) ||
              rationaleData?.category === key
            ) {
              categoryItems.push({
                type: 'rationale',
                intervention:
                  rationaleData.intervention || `Intervention ${id}`,
                rationale: rationaleData.rationale,
                evidence: rationaleData.evidence,
                id: id,
              })
              categoryHasRationales = true
            }
          }
        )
      }

      if (categoryHasRationales) {
        items.push({
          type: 'subheading',
          content: label,
          className: `font-semibold text-xs ${color} mb-2 ${items.length > 0 ? 'mt-4' : ''}`,
        })
        items.push(...categoryItems)
        hasAnyRationales = true
      }
    })

    // If we still haven't found any rationales, show all rationales without categorization
    if (!hasAnyRationales && Object.keys(rationale.interventions).length > 0) {
      items.push({
        type: 'subheading',
        content: 'Intervention Rationales',
        className: 'font-semibold text-xs mb-2',
      })

      Object.entries(rationale.interventions).forEach(([id, rationaleData]) => {
        if (
          rationaleData &&
          (rationaleData.rationale || rationaleData.evidence)
        ) {
          items.push({
            type: 'rationale',
            intervention: rationaleData.intervention || `Intervention ${id}`,
            rationale: rationaleData.rationale,
            evidence: rationaleData.evidence,
            id: id,
          })
        }
      })
    }
  }
  // Handle alternative rationale structures
  else if (
    rationale.independent ||
    rationale.dependent ||
    rationale.collaborative
  ) {
    const categories = [
      { key: 'independent', label: 'Independent Interventions' },
      { key: 'dependent', label: 'Dependent Interventions' },
      { key: 'collaborative', label: 'Collaborative Interventions' },
    ]

    categories.forEach(({ key, label }) => {
      if (rationale[key] && Object.keys(rationale[key]).length > 0) {
        items.push({
          type: 'subheading',
          content: label,
          className: `font-semibold text-xs mb-2 ${items.length > 0 ? 'mt-4' : ''}`,
        })

        Object.entries(rationale[key]).forEach(([index, data]) => {
          const rationaleText = typeof data === 'string' ? data : data.rationale
          const evidence = typeof data === 'object' ? data.evidence : ''

          if (rationaleText) {
            items.push({
              type: 'rationale',
              intervention: `Intervention ${parseInt(index) + 1}`,
              rationale: rationaleText,
              evidence: evidence,
              id: `${key}_${index}`,
            })
          }
        })
      }
    })
  }
  // Handle simple text rationale or any other structure
  else if (typeof rationale === 'string' && rationale.trim()) {
    items.push({
      type: 'text',
      content: rationale.trim(),
    })
  }
  // Handle unknown object structures - try to extract meaningful content
  else if (typeof rationale === 'object' && rationale !== null) {
    // Look for any rationale-like content in the object
    const rationaleEntries = []

    const extractRationales = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          rationaleEntries.push({
            key: prefix ? `${prefix}.${key}` : key,
            content: value.trim(),
          })
        } else if (typeof value === 'object' && value !== null) {
          if (value.rationale && typeof value.rationale === 'string') {
            rationaleEntries.push({
              key: prefix ? `${prefix}.${key}` : key,
              content: value.rationale,
              evidence: value.evidence,
            })
          } else {
            extractRationales(value, prefix ? `${prefix}.${key}` : key)
          }
        }
      })
    }

    extractRationales(rationale)

    if (rationaleEntries.length > 0) {
      items.push({
        type: 'subheading',
        content: 'Rationales',
        className: 'font-semibold text-xs mb-2',
      })

      rationaleEntries.forEach((entry, index) => {
        items.push({
          type: 'rationale',
          intervention: entry.key,
          rationale: entry.content,
          evidence: entry.evidence || '',
          id: `extracted_${index}`,
        })
      })
    }
  }

  return items
}

/**
 * Format Implementation section
 */
const formatImplementationSection = implementation => {
  const items = []

  // Helper function to safely process implementation lists
  const processImplementationList = implementationList => {
    if (!implementationList) return []

    if (Array.isArray(implementationList)) {
      return implementationList
    } else if (typeof implementationList === 'string') {
      // Split by newlines and create action objects
      return implementationList
        .split('\n')
        .map((item, index) => ({
          action_taken: item.trim(),
          id: `manual_${index}`,
        }))
        .filter(item => item.action_taken.length > 0)
    } else if (typeof implementationList === 'object') {
      // Try to convert object to array format
      return Object.entries(implementationList).map(([key, value], index) => ({
        action_taken: typeof value === 'string' ? value : `${key}: ${value}`,
        id: `obj_${index}`,
      }))
    }

    return []
  }

  const categories = [
    {
      key: 'independent',
      label: 'Independent Actions',
    },
    {
      key: 'dependent',
      label: 'Dependent Actions',
    },
    {
      key: 'collaborative',
      label: 'Collaborative Actions',
    },
  ]

  categories.forEach(({ key, label, color }) => {
    const implementationList = implementation[key]
    const processedImplementations =
      processImplementationList(implementationList)

    if (processedImplementations.length > 0) {
      items.push({
        type: 'subheading',
        content: label,
        className: `font-semibold text-xs ${color} mb-2 ${items.length > 0 ? 'mt-4' : ''}`,
      })

      processedImplementations.forEach(action => {
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

  // Helper function to safely process evaluation lists
  const processEvaluationList = evaluationList => {
    if (!evaluationList) return []

    if (Array.isArray(evaluationList)) {
      return evaluationList
    } else if (typeof evaluationList === 'string') {
      // Split by newlines
      return evaluationList
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0)
    } else if (typeof evaluationList === 'object') {
      // Try to extract values from object
      return Object.values(evaluationList).filter(
        item => item && typeof item === 'string'
      )
    }

    return []
  }

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
          className: `font-semibold text-xs mb-2 ${items.length > 0 ? 'mt-4' : ''}`,
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
              className: `font-medium text-xs ${statusColors[status]} mt-3 mb-1`,
            })

            Object.entries(periodData[status]).forEach(
              ([timeframe, evaluations]) => {
                items.push({
                  type: 'timeframe',
                  content: timeframe,
                  className:
                    'font-medium text-sm text-muted-foreground tracking-wide mt-2 mb-1',
                })

                const processedEvaluations = processEvaluationList(evaluations)
                processedEvaluations.forEach(evaluation => {
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
 * Starts at 4 columns since that's the minimum for NCP generation
 */
export const generateFormatOptions = allColumns => {
  // Start from 4 columns minimum, but don't exceed the total available columns
  const minColumns = 4
  const maxColumns = allColumns.length
  const startIndex = Math.min(minColumns - 1, maxColumns - 1)

  return allColumns.slice(startIndex).map((_, index) => {
    const columnCount = startIndex + index + 1
    return {
      value: columnCount.toString(),
      label: `${columnCount} Column${columnCount !== 1 ? 's' : ''}`,
      description: `Display ${columnCount} column${columnCount !== 1 ? 's' : ''} of the NCP`,
    }
  })
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
