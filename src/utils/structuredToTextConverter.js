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
  if (!structuredData || typeof structuredData !== 'object') {
    return typeof structuredData === 'string' ? structuredData : ''
  }

  switch (columnKey) {
    case 'diagnosis':
      return convertDiagnosisToText(structuredData)
    case 'outcomes':
      return convertOutcomesToText(structuredData)
    case 'interventions':
      return convertInterventionsToText(structuredData)
    case 'rationale':
      return convertRationaleToText(structuredData)
    case 'implementation':
      return convertImplementationToText(structuredData)
    case 'evaluation':
      return convertEvaluationToText(structuredData)
    default:
      return JSON.stringify(structuredData, null, 2)
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
  if (!rationale.interventions) {
    return JSON.stringify(rationale, null, 2)
  }

  let text = 'INTERVENTION RATIONALES:\n\n'

  Object.entries(rationale.interventions).forEach(([id, data]) => {
    text += `Intervention ID: ${id}\n`
    text += `Rationale: ${data.rationale}\n`
    if (data.evidence) {
      text += `Evidence: ${data.evidence}\n`
    }
    text += '\n'
  })

  return text.trim()
}

function convertTextToRationale(text) {
  const rationale = { interventions: {} }
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
    }
  })

  return rationale
}

// === IMPLEMENTATION CONVERTERS ===

function convertImplementationToText(implementation) {
  let text = ''

  if (implementation.independent && implementation.independent.length > 0) {
    text += 'INDEPENDENT ACTIONS:\n\n'
    implementation.independent.forEach((item, index) => {
      const action = typeof item === 'object' ? item.action : item
      text += `${index + 1}. ${action}\n`
    })
    text += '\n'
  }

  if (implementation.dependent && implementation.dependent.length > 0) {
    text += 'DEPENDENT ACTIONS:\n\n'
    implementation.dependent.forEach((item, index) => {
      const action = typeof item === 'object' ? item.action : item
      text += `${index + 1}. ${action}\n`
    })
    text += '\n'
  }

  if (implementation.collaborative && implementation.collaborative.length > 0) {
    text += 'COLLABORATIVE ACTIONS:\n\n'
    implementation.collaborative.forEach((item, index) => {
      const action = typeof item === 'object' ? item.action : item
      text += `${index + 1}. ${action}\n`
    })
  }

  return text.trim()
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
          action: action,
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
          action: action,
          id: `${currentSection}_${implementation[currentSection].length}`,
        })
      }
    }
  })

  return implementation
}

// === EVALUATION CONVERTERS ===

function convertEvaluationToText(evaluation) {
  let text = ''

  if (evaluation.short_term) {
    text += 'SHORT-TERM EVALUATION:\n\n'
    text += convertEvaluationTimeframesToText(evaluation.short_term.timeframes)
    text += '\n'
  }

  if (evaluation.long_term) {
    text += 'LONG-TERM EVALUATION:\n\n'
    text += convertEvaluationTimeframesToText(evaluation.long_term.timeframes)
  }

  return text.trim()
}

function convertEvaluationTimeframesToText(timeframes) {
  let text = ''

  if (Array.isArray(timeframes)) {
    timeframes.forEach(tf => {
      if (tf.timeframe) {
        text += `${tf.timeframe}:\n`
        if (tf.status) {
          text += `  Status: ${tf.status}\n`
        }
        if (tf.details) {
          text += `  Details: ${tf.details}\n`
        }
        text += '\n'
      }
    })
  } else if (typeof timeframes === 'object') {
    Object.values(timeframes).forEach(value => {
      if (typeof value === 'object' && value.timeframe) {
        text += `${value.timeframe}:\n`
        if (value.status) {
          text += `  Status: ${value.status}\n`
        }
        if (value.details) {
          text += `  Details: ${value.details}\n`
        }
        text += '\n'
      }
    })
  }

  return text
}

function convertTextToEvaluation(text) {
  const lines = text.split('\n').map(line => line.trim())
  const evaluation = {
    short_term: { timeframes: [] },
    long_term: { timeframes: [] },
  }

  let currentSection = null
  let currentTimeframe = null
  let currentStatus = null
  let currentDetails = null

  lines.forEach(line => {
    if (line.toUpperCase().includes('SHORT-TERM')) {
      currentSection = 'short_term'
    } else if (line.toUpperCase().includes('LONG-TERM')) {
      currentSection = 'long_term'
    } else if (
      line.includes(':') &&
      !line.toLowerCase().startsWith('status:') &&
      !line.toLowerCase().startsWith('details:')
    ) {
      // Save previous timeframe if exists
      if (currentTimeframe) {
        const timeframeObj = {
          timeframe: currentTimeframe,
          status: currentStatus || 'Not specified',
          details: currentDetails || '',
        }
        if (currentSection) {
          evaluation[currentSection].timeframes.push(timeframeObj)
        }
      }

      // Start new timeframe
      currentTimeframe = line.replace(':', '').trim()
      currentStatus = null
      currentDetails = null
    } else if (line.toLowerCase().startsWith('status:')) {
      currentStatus = line.replace(/^status:\s*/i, '').trim()
    } else if (line.toLowerCase().startsWith('details:')) {
      currentDetails = line.replace(/^details:\s*/i, '').trim()
    }
  })

  // Don't forget the last timeframe
  if (currentTimeframe) {
    const timeframeObj = {
      timeframe: currentTimeframe,
      status: currentStatus || 'Not specified',
      details: currentDetails || '',
    }
    if (currentSection) {
      evaluation[currentSection].timeframes.push(timeframeObj)
    }
  }

  return evaluation
}
