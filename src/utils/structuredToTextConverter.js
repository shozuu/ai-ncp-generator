/**
 * Utility functions to convert structured NCP data to user-friendly text format for editing
 * and back to structured format for saving
 */

/**
 * Convert structured data to plain text for editing
 * @param {Object} structuredData - The structured data object
 * @param {string} columnKey - The column being edited (diagnosis, outcomes, etc.)
 * @returns {string} Plain text representation
 */
export function convertStructuredToText(structuredData, columnKey) {
  // Handle null, undefined, or non-object data
  if (!structuredData) {
    return getEmptyPlaceholder(columnKey)
  }

  if (typeof structuredData === 'string') {
    return structuredData || getEmptyPlaceholder(columnKey)
  }

  if (typeof structuredData !== 'object') {
    return getEmptyPlaceholder(columnKey)
  }

  try {
    let result = ''
    switch (columnKey) {
      case 'diagnosis':
        result = convertDiagnosisToText(structuredData)
        break
      case 'outcomes':
        result = convertOutcomesToText(structuredData)
        break
      case 'interventions':
        result = convertInterventionsToText(structuredData)
        break
      case 'rationale':
        result = convertRationaleToText(structuredData)
        break
      case 'implementation':
        result = convertImplementationToText(structuredData)
        break
      case 'evaluation':
        result = convertEvaluationToText(structuredData)
        break
      default:
        result = JSON.stringify(structuredData, null, 2)
    }

    // If result is empty or just whitespace, return placeholder
    return result && result.trim() ? result : getEmptyPlaceholder(columnKey)
  } catch (error) {
    console.warn(`Error converting ${columnKey} to text:`, error)
    return getEmptyPlaceholder(columnKey)
  }
}

/**
 * Get placeholder text for empty sections
 * @param {string} columnKey - The column type
 * @returns {string} Placeholder text
 */
function getEmptyPlaceholder(columnKey) {
  switch (columnKey) {
    case 'diagnosis':
      return 'Enter the nursing diagnosis statement here...'
    case 'outcomes':
      return `SHORT-TERM OUTCOMES:

Within [timeframe]:
  - Add short-term outcome here

LONG-TERM OUTCOMES:

Within [timeframe]:
  - Add long-term outcome here`
    case 'interventions':
      return `INDEPENDENT INTERVENTIONS:

1. Add independent intervention here

DEPENDENT INTERVENTIONS:

1. Add dependent intervention here

COLLABORATIVE INTERVENTIONS:

1. Add collaborative intervention here`
    case 'rationale':
      return `INTERVENTION RATIONALES:

Intervention ID: [intervention_id]
Rationale: Add rationale here
Evidence: Add supporting evidence here`
    case 'implementation':
      return `INDEPENDENT ACTIONS:

1. Add completed independent action here

DEPENDENT ACTIONS:

1. Add completed dependent action here

COLLABORATIVE ACTIONS:

1. Add completed collaborative action here`
    case 'evaluation':
      return `SHORT-TERM EVALUATION:

Within [timeframe]:
  Status: Met/Partially Met/Not Met
  Details: Add evaluation details here

LONG-TERM EVALUATION:

Within [timeframe]:
  Status: Met/Partially Met/Not Met
  Details: Add evaluation details here`
    default:
      return ''
  }
}

/**
 * Convert plain text back to structured format
 * @param {string} textData - The plain text data
 * @param {string} columnKey - The column being saved
 * @returns {Object} Structured data object
 */
export function convertTextToStructured(textData, columnKey) {
  if (!textData || typeof textData !== 'string') {
    return {}
  }

  // First try to parse as JSON (in case user wants to edit JSON directly)
  try {
    const parsed = JSON.parse(textData)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed
    }
  } catch {
    // Not JSON, continue with text parsing
  }

  switch (columnKey) {
    case 'diagnosis':
      return convertTextToDiagnosis(textData)
    case 'outcomes':
      return convertTextToOutcomes(textData)
    case 'interventions':
      return convertTextToInterventions(textData)
    case 'rationale':
      return convertTextToRationale(textData)
    case 'implementation':
      return convertTextToImplementation(textData)
    case 'evaluation':
      return convertTextToEvaluation(textData)
    default:
      return { text: textData }
  }
}

// === DIAGNOSIS CONVERTERS ===

function convertDiagnosisToText(diagnosis) {
  if (diagnosis.statement) {
    return diagnosis.statement
  }
  return JSON.stringify(diagnosis, null, 2)
}

function convertTextToDiagnosis(text) {
  return {
    statement: text.trim(),
  }
}

// === OUTCOMES CONVERTERS ===

function convertOutcomesToText(outcomes) {
  let text = ''

  if (outcomes.short_term) {
    text += 'SHORT-TERM OUTCOMES:\n\n'
    text += convertTimeframesToText(outcomes.short_term.timeframes)
    text += '\n'
  }

  if (outcomes.long_term) {
    text += 'LONG-TERM OUTCOMES:\n\n'
    text += convertTimeframesToText(outcomes.long_term.timeframes)
  }

  return text.trim()
}

function convertTimeframesToText(timeframes) {
  let text = ''

  if (Array.isArray(timeframes)) {
    timeframes.forEach(tf => {
      if (tf.timeframe) {
        text += `${tf.timeframe}:\n`
        if (tf.outcomes && Array.isArray(tf.outcomes)) {
          tf.outcomes.forEach(outcome => {
            text += `  - ${outcome}\n`
          })
        }
        text += '\n'
      }
    })
  } else if (typeof timeframes === 'object') {
    Object.entries(timeframes).forEach(([key, value]) => {
      if (typeof value === 'object' && value.timeframe) {
        text += `${value.timeframe}:\n`
        if (value.outcomes && Array.isArray(value.outcomes)) {
          value.outcomes.forEach(outcome => {
            text += `  - ${outcome}\n`
          })
        }
        text += '\n'
      } else if (Array.isArray(value)) {
        text += `${key}:\n`
        value.forEach(outcome => {
          text += `  - ${outcome}\n`
        })
        text += '\n'
      }
    })
  }

  return text
}

function convertTextToOutcomes(text) {
  const lines = text.split('\n').map(line => line.trim())
  const outcomes = {
    short_term: { timeframes: [] },
    long_term: { timeframes: [] },
  }

  let currentSection = null
  let currentTimeframe = null
  let currentOutcomes = []

  lines.forEach(line => {
    if (line.toUpperCase().includes('SHORT-TERM')) {
      currentSection = 'short_term'
    } else if (line.toUpperCase().includes('LONG-TERM')) {
      currentSection = 'long_term'
    } else if (
      line.includes(':') &&
      !line.startsWith('-') &&
      !line.startsWith('  -')
    ) {
      // Save previous timeframe if exists
      if (currentTimeframe && currentOutcomes.length > 0) {
        const timeframeObj = {
          timeframe: currentTimeframe,
          outcomes: [...currentOutcomes],
        }
        if (currentSection) {
          outcomes[currentSection].timeframes.push(timeframeObj)
        }
      }

      // Start new timeframe
      currentTimeframe = line.replace(':', '').trim()
      currentOutcomes = []
    } else if (line.startsWith('-') || line.startsWith('  -')) {
      // Add outcome to current timeframe
      const outcome = line.replace(/^[\s-]+/, '').trim()
      if (outcome) {
        currentOutcomes.push(outcome)
      }
    }
  })

  // Don't forget the last timeframe
  if (currentTimeframe && currentOutcomes.length > 0) {
    const timeframeObj = {
      timeframe: currentTimeframe,
      outcomes: [...currentOutcomes],
    }
    if (currentSection) {
      outcomes[currentSection].timeframes.push(timeframeObj)
    }
  }

  return outcomes
}

// === INTERVENTIONS CONVERTERS ===

function convertInterventionsToText(interventions) {
  let text = ''

  if (interventions.independent && interventions.independent.length > 0) {
    text += 'INDEPENDENT INTERVENTIONS:\n\n'
    interventions.independent.forEach((item, index) => {
      const intervention = typeof item === 'object' ? item.intervention : item
      text += `${index + 1}. ${intervention}\n`
    })
    text += '\n'
  }

  if (interventions.dependent && interventions.dependent.length > 0) {
    text += 'DEPENDENT INTERVENTIONS:\n\n'
    interventions.dependent.forEach((item, index) => {
      const intervention = typeof item === 'object' ? item.intervention : item
      text += `${index + 1}. ${intervention}\n`
    })
    text += '\n'
  }

  if (interventions.collaborative && interventions.collaborative.length > 0) {
    text += 'COLLABORATIVE INTERVENTIONS:\n\n'
    interventions.collaborative.forEach((item, index) => {
      const intervention = typeof item === 'object' ? item.intervention : item
      text += `${index + 1}. ${intervention}\n`
    })
  }

  return text.trim()
}

function convertTextToInterventions(text) {
  const lines = text.split('\n').map(line => line.trim())
  const interventions = {
    independent: [],
    dependent: [],
    collaborative: [],
  }

  let currentSection = null

  lines.forEach(line => {
    if (line.toUpperCase().includes('INDEPENDENT')) {
      currentSection = 'independent'
    } else if (line.toUpperCase().includes('DEPENDENT')) {
      currentSection = 'dependent'
    } else if (line.toUpperCase().includes('COLLABORATIVE')) {
      currentSection = 'collaborative'
    } else if (line && currentSection && /^\d+\./.test(line)) {
      const intervention = line.replace(/^\d+\.\s*/, '').trim()
      if (intervention) {
        interventions[currentSection].push({
          intervention: intervention,
          id: `${currentSection}_${interventions[currentSection].length}`,
        })
      }
    } else if (
      line &&
      currentSection &&
      (line.startsWith('-') || line.startsWith('•'))
    ) {
      const intervention = line.replace(/^[-•]\s*/, '').trim()
      if (intervention) {
        interventions[currentSection].push({
          intervention: intervention,
          id: `${currentSection}_${interventions[currentSection].length}`,
        })
      }
    }
  })

  return interventions
}

// === RATIONALE CONVERTERS ===

function convertRationaleToText(rationale) {
  if (!rationale || typeof rationale !== 'object') {
    return ''
  }

  let text = ''
  let hasAnyContent = false

  // Handle the standard interventions-based rationale structure
  if (
    rationale.interventions &&
    Object.keys(rationale.interventions).length > 0
  ) {
    text += 'INTERVENTION RATIONALES:\n\n'

    Object.entries(rationale.interventions).forEach(([id, data]) => {
      text += `Intervention ID: ${id}\n`
      if (data.rationale) {
        text += `Rationale: ${data.rationale}\n`
      }
      if (data.evidence) {
        text += `Evidence: ${data.evidence}\n`
      }
      text += '\n'
      hasAnyContent = true
    })
  }
  // Handle alternative rationale structures
  else if (
    rationale.independent ||
    rationale.dependent ||
    rationale.collaborative
  ) {
    text += 'INTERVENTION RATIONALES:\n\n'

    const categories = [
      { key: 'independent', label: 'INDEPENDENT INTERVENTIONS' },
      { key: 'dependent', label: 'DEPENDENT INTERVENTIONS' },
      { key: 'collaborative', label: 'COLLABORATIVE INTERVENTIONS' },
    ]

    categories.forEach(({ key, label }) => {
      if (rationale[key] && Object.keys(rationale[key]).length > 0) {
        text += `${label}:\n\n`

        Object.entries(rationale[key]).forEach(([index, data]) => {
          text += `${parseInt(index) + 1}. ${data.rationale || data}\n`
          if (data.evidence) {
            text += `   Evidence: ${data.evidence}\n`
          }
        })
        text += '\n'
        hasAnyContent = true
      }
    })
  }
  // Handle simple key-value rationale structure
  else {
    // Try to extract rationale content from any structure
    const possibleRationaleKeys = [
      'rationale',
      'text',
      'content',
      'description',
    ]
    const rationaleEntries = []

    // Look for direct rationale entries
    Object.entries(rationale).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        rationaleEntries.push({ key, value })
      } else if (typeof value === 'object' && value !== null) {
        // Look inside objects for rationale content
        possibleRationaleKeys.forEach(rationaleKey => {
          if (value[rationaleKey] && typeof value[rationaleKey] === 'string') {
            rationaleEntries.push({
              key: `${key}.${rationaleKey}`,
              value: value[rationaleKey],
            })
          }
        })
      }
    })

    if (rationaleEntries.length > 0) {
      text += 'RATIONALES:\n\n'
      rationaleEntries.forEach(({ value }, index) => {
        text += `${index + 1}. ${value}\n`
        hasAnyContent = true
      })
    } else if (Object.keys(rationale).length > 0) {
      // Last resort: show as JSON
      return JSON.stringify(rationale, null, 2)
    }
  }

  return hasAnyContent ? text.trim() : ''
}

function convertTextToRationale(text) {
  // Validate input
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { interventions: {} }
  }

  // Try to parse as JSON first (in case user pasted JSON)
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed === 'object' && parsed !== null) {
      // Validate that the parsed JSON has a reasonable structure
      if (
        parsed.interventions ||
        parsed.independent ||
        parsed.dependent ||
        parsed.collaborative
      ) {
        return parsed
      }
    }
  } catch {
    // Not JSON, continue with text parsing
  }

  const rationale = { interventions: {} }
  let rationaleCount = 0 // Track how many rationales we find

  // Handle multiple formats:
  // 1. "Intervention ID:" format (from help content)
  // 2. "INTERVENTION RATIONALES:" format (from help content)
  // 3. Simple key-value pairs

  if (text.includes('Intervention ID:') || text.includes('INTERVENTION ID:')) {
    // Format 1: Intervention ID: sections
    const sections = text.split(/Intervention ID:/i).slice(1)

    sections.forEach(section => {
      const lines = section.split('\n').map(line => line.trim())
      let id = null
      let rationaleText = ''
      let evidence = ''

      lines.forEach(line => {
        if (!id && line) {
          id = line.trim()
        } else if (line.toLowerCase().startsWith('rationale:')) {
          rationaleText = line.replace(/^rationale:\s*/i, '').trim()
        } else if (line.toLowerCase().startsWith('evidence:')) {
          evidence = line.replace(/^evidence:\s*/i, '').trim()
        }
      })

      if (id && rationaleText) {
        rationale.interventions[id] = {
          rationale: rationaleText,
          evidence: evidence,
        }
        rationaleCount++
      }
    })
  } else if (text.toUpperCase().includes('INTERVENTION RATIONALES:')) {
    // Format 2: INTERVENTION RATIONALES: sections (from help content)
    const sections = text.split(/INTERVENTION RATIONALES:/i).slice(1)

    sections.forEach(section => {
      const lines = section.split('\n').map(line => line.trim())
      let currentId = null

      lines.forEach(line => {
        if (line && /^[A-Za-z0-9_-]+\s*:?\s*$/.test(line)) {
          // This looks like an intervention ID
          currentId = line.replace(':', '').trim()
        } else if (line.toLowerCase().startsWith('rationale:') && currentId) {
          const rationaleText = line.replace(/^rationale:\s*/i, '').trim()
          if (rationaleText) {
            rationale.interventions[currentId] = {
              rationale: rationaleText,
              evidence: '',
            }
            rationaleCount++
          }
        } else if (line.toLowerCase().startsWith('evidence:') && currentId) {
          const evidence = line.replace(/^evidence:\s*/i, '').trim()
          if (rationale.interventions[currentId]) {
            rationale.interventions[currentId].evidence = evidence
          }
        }
      })
    })
  } else {
    // Format 3: Try to parse as simple key-value pairs or plain text
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)

    let currentId = null
    let nextIdCounter = 1

    lines.forEach(line => {
      if (line.includes(':')) {
        const colonIndex = line.indexOf(':')
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()

        if (value) {
          // Could be "ID: rationale" format
          rationale.interventions[key || `intervention_${nextIdCounter++}`] = {
            rationale: value,
            evidence: '',
          }
          rationaleCount++
        } else if (key) {
          // Could be just "ID:" waiting for next line
          currentId = key || `intervention_${nextIdCounter++}`
        }
      } else if (currentId && line) {
        // This line could be the rationale for the previous ID
        rationale.interventions[currentId] = {
          rationale: line,
          evidence: '',
        }
        rationaleCount++
        currentId = null
      } else if (line && !currentId) {
        // Standalone rationale text without explicit ID
        const id = `intervention_${nextIdCounter++}`
        rationale.interventions[id] = {
          rationale: line,
          evidence: '',
        }
        rationaleCount++
      }
    })
  }

  // If we didn't find any structured rationales, but there's text content,
  // store it as a single generic rationale
  if (rationaleCount === 0 && text.trim()) {
    rationale.interventions['general'] = {
      rationale: text.trim(),
      evidence: '',
    }
  }

  return rationale
}

// === IMPLEMENTATION CONVERTERS ===

function convertImplementationToText(implementation) {
  if (!implementation || typeof implementation !== 'object') {
    return ''
  }

  let text = ''
  let hasAnyContent = false

  // Helper function to safely process implementation lists (matches the display renderer)
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
    { key: 'independent', label: 'INDEPENDENT ACTIONS' },
    { key: 'dependent', label: 'DEPENDENT ACTIONS' },
    { key: 'collaborative', label: 'COLLABORATIVE ACTIONS' },
  ]

  categories.forEach(({ key, label }) => {
    const implementationList = implementation[key]
    const processedImplementations =
      processImplementationList(implementationList)

    if (processedImplementations.length > 0) {
      text += `${label}:\n\n`
      processedImplementations.forEach((actionObj, index) => {
        // Handle both action_taken and action properties for compatibility
        const action = actionObj.action_taken || actionObj.action || actionObj
        const actionText =
          typeof action === 'object'
            ? action.action_taken || action.action
            : action
        if (actionText && actionText.trim()) {
          text += `${index + 1}. ${actionText}\n`
          hasAnyContent = true
        }
      })
      text += '\n'
    }
  })

  return hasAnyContent ? text.trim() : ''
}

function convertTextToImplementation(text) {
  const lines = text.split('\n').map(line => line.trim())
  const implementation = {
    independent: [],
    dependent: [],
    collaborative: [],
  }

  let currentSection = null

  lines.forEach(line => {
    if (line.toUpperCase().includes('INDEPENDENT')) {
      currentSection = 'independent'
    } else if (line.toUpperCase().includes('DEPENDENT')) {
      currentSection = 'dependent'
    } else if (line.toUpperCase().includes('COLLABORATIVE')) {
      currentSection = 'collaborative'
    } else if (line && currentSection && /^\d+\./.test(line)) {
      const action = line.replace(/^\d+\.\s*/, '').trim()
      if (action) {
        implementation[currentSection].push({
          action_taken: action, // Use action_taken to match display renderer
          id: `${currentSection}_${implementation[currentSection].length}`,
        })
      }
    } else if (
      line &&
      currentSection &&
      (line.startsWith('-') || line.startsWith('•'))
    ) {
      const action = line.replace(/^[-•]\s*/, '').trim()
      if (action) {
        implementation[currentSection].push({
          action_taken: action, // Use action_taken to match display renderer
          id: `${currentSection}_${implementation[currentSection].length}`,
        })
      }
    }
  })

  return implementation
}

// === EVALUATION CONVERTERS ===

function convertEvaluationToText(evaluation) {
  if (!evaluation || typeof evaluation !== 'object') {
    return ''
  }

  let text = ''
  let hasAnyContent = false

  // Handle the actual evaluation data structure based on display renderer
  const timePeriods = ['short_term', 'long_term']
  const timePeriodLabels = {
    short_term: 'SHORT-TERM EVALUATION',
    long_term: 'LONG-TERM EVALUATION',
  }

  timePeriods.forEach(period => {
    if (evaluation[period]) {
      const periodData = evaluation[period]

      // Check if this period has any content
      const hasContent = Object.keys(periodData).some(
        status =>
          periodData[status] && Object.keys(periodData[status]).length > 0
      )

      if (hasContent) {
        text += `${timePeriodLabels[period]}:\n\n`

        const statuses = ['Met', 'Partially Met', 'Not Met']

        statuses.forEach(status => {
          if (periodData[status]) {
            text += `Status: ${status}\n`

            Object.entries(periodData[status]).forEach(
              ([timeframe, evaluations]) => {
                text += `${timeframe}:\n`

                // Process evaluations (can be array, string, or object)
                let evaluationList = []
                if (Array.isArray(evaluations)) {
                  evaluationList = evaluations
                } else if (typeof evaluations === 'string') {
                  evaluationList = evaluations
                    .split('\n')
                    .map(item => item.trim())
                    .filter(item => item.length > 0)
                } else if (typeof evaluations === 'object') {
                  evaluationList = Object.values(evaluations).filter(
                    item => item && typeof item === 'string'
                  )
                }

                evaluationList.forEach(eval_item => {
                  text += `  - ${eval_item}\n`
                })
                text += '\n'
              }
            )
          }
        })

        hasAnyContent = true
      }
    }
  })

  return hasAnyContent ? text.trim() : ''
}

function convertTextToEvaluation(text) {
  const lines = text.split('\n').map(line => line.trim())
  const evaluation = {
    short_term: {},
    long_term: {},
  }

  let currentSection = null
  let currentStatus = null
  let currentTimeframe = null
  let currentEvaluations = []

  lines.forEach(line => {
    if (line.toUpperCase().includes('SHORT-TERM')) {
      currentSection = 'short_term'
    } else if (line.toUpperCase().includes('LONG-TERM')) {
      currentSection = 'long_term'
    } else if (line.toLowerCase().startsWith('status:')) {
      // Save previous timeframe data if exists
      if (
        currentSection &&
        currentStatus &&
        currentTimeframe &&
        currentEvaluations.length > 0
      ) {
        if (!evaluation[currentSection][currentStatus]) {
          evaluation[currentSection][currentStatus] = {}
        }
        evaluation[currentSection][currentStatus][currentTimeframe] = [
          ...currentEvaluations,
        ]
      }

      // Start new status
      currentStatus = line.replace(/^status:\s*/i, '').trim()
      currentTimeframe = null
      currentEvaluations = []
    } else if (line.includes(':') && !line.startsWith('-') && currentStatus) {
      // Save previous timeframe data if exists
      if (
        currentSection &&
        currentStatus &&
        currentTimeframe &&
        currentEvaluations.length > 0
      ) {
        if (!evaluation[currentSection][currentStatus]) {
          evaluation[currentSection][currentStatus] = {}
        }
        evaluation[currentSection][currentStatus][currentTimeframe] = [
          ...currentEvaluations,
        ]
      }

      // Start new timeframe
      currentTimeframe = line.replace(':', '').trim()
      currentEvaluations = []
    } else if (line.startsWith('-') && currentTimeframe) {
      const evalText = line.replace(/^-\s*/, '').trim()
      if (evalText) {
        currentEvaluations.push(evalText)
      }
    }
  })

  // Save the last timeframe data
  if (
    currentSection &&
    currentStatus &&
    currentTimeframe &&
    currentEvaluations.length > 0
  ) {
    if (!evaluation[currentSection][currentStatus]) {
      evaluation[currentSection][currentStatus] = {}
    }
    evaluation[currentSection][currentStatus][currentTimeframe] = [
      ...currentEvaluations,
    ]
  }

  return evaluation
}
