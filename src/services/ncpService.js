import { supabase } from '@/lib/supabase'
import { generateDefaultNCPTitle } from '@/utils/ncpUtils'
import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const ncpService = {
  async generateComprehensiveNCP(assessmentData) {
    try {
      console.log(
        'Generating comprehensive NCP with structured data:',
        assessmentData
      )

      const response = await axios.post(
        `${API_BASE_URL}/api/suggest-diagnoses`,
        assessmentData,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const result = response.data
      console.log('Received comprehensive result:', result)

      if (result.ncp) {
        // Transform the structured JSON to our display format
        const transformedNCP = this.transformStructuredNCP(result.ncp)

        // Save to Supabase with the user's preferred format
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await this.saveStructuredNCP(transformedNCP, result, assessmentData)
        }

        return {
          diagnosis: result,
          ncp: transformedNCP,
          originalStructuredNCP: result.ncp, // Keep original for reference
        }
      } else {
        // Only diagnosis was generated
        return {
          diagnosis: result,
          ncp: null,
        }
      }
    } catch (error) {
      console.error(
        'Comprehensive generation error:',
        error.response?.data || error
      )

      const errorDetail = error.response?.data?.detail
      let errorMessage = 'Failed to generate diagnosis and NCP'
      let suggestion = ''

      if (errorDetail) {
        if (typeof errorDetail === 'string') {
          errorMessage = errorDetail
        } else if (errorDetail.message) {
          errorMessage = errorDetail.message
          if (errorDetail.suggestion) {
            suggestion = errorDetail.suggestion
          }
        }
      }

      let finalMessage = errorMessage
      if (suggestion) {
        finalMessage += ` ${suggestion}`
      }

      throw new Error(finalMessage)
    }
  },

  // Transform structured JSON NCP to display format
  transformStructuredNCP(structuredNCP) {
    try {
      const transformed = {}

      // Assessment
      if (structuredNCP.assessment) {
        const assessment = structuredNCP.assessment
        let assessmentText = ''

        if (assessment.subjective && assessment.subjective.length > 0) {
          assessmentText += '**Subjective Data:**\n'
          assessment.subjective.forEach(item => {
            assessmentText += `- ${item}\n`
          })
          assessmentText += '\n'
        }

        if (assessment.objective && assessment.objective.length > 0) {
          assessmentText += '**Objective Data:**\n'
          assessment.objective.forEach(item => {
            assessmentText += `- ${item}\n`
          })
        }

        transformed.assessment = assessmentText.trim()
      }

      // Diagnosis
      if (structuredNCP.diagnosis?.statement) {
        transformed.diagnosis = structuredNCP.diagnosis.statement
      }

      // Outcomes
      if (structuredNCP.outcomes) {
        let outcomesText = ''

        if (structuredNCP.outcomes.short_term?.timeframes) {
          outcomesText += '**Short-Term Outcomes:**\n'
          Object.entries(structuredNCP.outcomes.short_term.timeframes).forEach(
            ([timeframe, outcomes]) => {
              outcomesText += `* ${timeframe}:\n`
              outcomes.forEach(outcome => {
                outcomesText += `  - ${outcome}\n`
              })
            }
          )
          outcomesText += '\n'
        }

        if (structuredNCP.outcomes.long_term?.timeframes) {
          outcomesText += '**Long-Term Outcomes:**\n'
          Object.entries(structuredNCP.outcomes.long_term.timeframes).forEach(
            ([timeframe, outcomes]) => {
              outcomesText += `* ${timeframe}:\n`
              outcomes.forEach(outcome => {
                outcomesText += `  - ${outcome}\n`
              })
            }
          )
        }

        transformed.outcomes = outcomesText.trim()
      }

      // Interventions
      if (structuredNCP.interventions) {
        let interventionsText = ''

        if (structuredNCP.interventions.independent?.length > 0) {
          interventionsText += '**Independent:**\n'
          structuredNCP.interventions.independent.forEach(intervention => {
            interventionsText += `- ${intervention.intervention}\n`
          })
          interventionsText += '\n'
        }

        if (structuredNCP.interventions.dependent?.length > 0) {
          interventionsText += '**Dependent:**\n'
          structuredNCP.interventions.dependent.forEach(intervention => {
            interventionsText += `- ${intervention.intervention}\n`
          })
          interventionsText += '\n'
        }

        if (structuredNCP.interventions.collaborative?.length > 0) {
          interventionsText += '**Collaborative:**\n'
          structuredNCP.interventions.collaborative.forEach(intervention => {
            interventionsText += `- ${intervention.intervention}\n`
          })
        }

        transformed.interventions = interventionsText.trim()
      }

      // Rationale
      if (structuredNCP.rationale?.interventions) {
        let rationaleText = ''

        // Group rationales by intervention type
        const independent = structuredNCP.interventions?.independent || []
        const dependent = structuredNCP.interventions?.dependent || []
        const collaborative = structuredNCP.interventions?.collaborative || []

        if (independent.length > 0) {
          rationaleText += '**Independent:**\n'
          independent.forEach(intervention => {
            const rationale =
              structuredNCP.rationale.interventions[intervention.id]
            if (rationale) {
              rationaleText += `- ${rationale.rationale}`
              if (rationale.evidence) {
                rationaleText += ` ${rationale.evidence}`
              }
              rationaleText += '\n'
            }
          })
          rationaleText += '\n'
        }

        if (dependent.length > 0) {
          rationaleText += '**Dependent:**\n'
          dependent.forEach(intervention => {
            const rationale =
              structuredNCP.rationale.interventions[intervention.id]
            if (rationale) {
              rationaleText += `- ${rationale.rationale}`
              if (rationale.evidence) {
                rationaleText += ` ${rationale.evidence}`
              }
              rationaleText += '\n'
            }
          })
          rationaleText += '\n'
        }

        if (collaborative.length > 0) {
          rationaleText += '**Collaborative:**\n'
          collaborative.forEach(intervention => {
            const rationale =
              structuredNCP.rationale.interventions[intervention.id]
            if (rationale) {
              rationaleText += `- ${rationale.rationale}`
              if (rationale.evidence) {
                rationaleText += ` ${rationale.evidence}`
              }
              rationaleText += '\n'
            }
          })
        }

        transformed.rationale = rationaleText.trim()
      }

      // Implementation
      if (structuredNCP.implementation) {
        let implementationText = ''

        if (structuredNCP.implementation.independent?.length > 0) {
          implementationText += '**Independent:**\n'
          structuredNCP.implementation.independent.forEach(impl => {
            implementationText += `- ${impl.action_taken}\n`
          })
          implementationText += '\n'
        }

        if (structuredNCP.implementation.dependent?.length > 0) {
          implementationText += '**Dependent:**\n'
          structuredNCP.implementation.dependent.forEach(impl => {
            implementationText += `- ${impl.action_taken}\n`
          })
          implementationText += '\n'
        }

        if (structuredNCP.implementation.collaborative?.length > 0) {
          implementationText += '**Collaborative:**\n'
          structuredNCP.implementation.collaborative.forEach(impl => {
            implementationText += `- ${impl.action_taken}\n`
          })
        }

        transformed.implementation = implementationText.trim()
      }

      // Evaluation
      if (structuredNCP.evaluation) {
        let evaluationText = ''

        if (structuredNCP.evaluation.short_term) {
          evaluationText += '**Short-Term:**\n'
          Object.entries(structuredNCP.evaluation.short_term).forEach(
            ([status, statusData]) => {
              evaluationText += `* ${status}:\n`
              Object.entries(statusData).forEach(([timeframe, outcomes]) => {
                evaluationText += `  - ${timeframe}:\n`
                outcomes.forEach(outcome => {
                  evaluationText += `    • ${outcome}\n`
                })
              })
            }
          )
          evaluationText += '\n'
        }

        if (structuredNCP.evaluation.long_term) {
          evaluationText += '**Long-Term:**\n'
          Object.entries(structuredNCP.evaluation.long_term).forEach(
            ([status, statusData]) => {
              evaluationText += `* ${status}:\n`
              Object.entries(statusData).forEach(([timeframe, outcomes]) => {
                evaluationText += `  - ${timeframe}:\n`
                outcomes.forEach(outcome => {
                  evaluationText += `    • ${outcome}\n`
                })
              })
            }
          )
        }

        transformed.evaluation = evaluationText.trim()
      }

      return transformed
    } catch (error) {
      console.error('Error transforming structured NCP:', error)
      throw new Error('Failed to transform structured NCP data for display')
    }
  },

  async saveStructuredNCP(
    ncpData,
    diagnosisResult,
    assessmentData,
    title = null
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const ncpTitle = title || generateDefaultNCPTitle()

    const { data, error } = await supabase
      .from('ncps')
      .insert([
        {
          user_id: user.id,
          title: ncpTitle,
          assessment: ncpData.assessment,
          diagnosis: ncpData.diagnosis,
          outcomes: ncpData.outcomes,
          interventions: ncpData.interventions,
          rationale: ncpData.rationale,
          implementation: ncpData.implementation,
          evaluation: ncpData.evaluation,
          reasoning: diagnosisResult.reasoning,
          format_type: assessmentData.format || '7',
        },
      ])
      .select()

    if (error) throw error
    return data[0]
  },

  async updateNCP(ncpId, ncpData) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const updateData = {}

    if (ncpData.diagnosis !== undefined)
      updateData.diagnosis = ncpData.diagnosis
    if (ncpData.outcomes !== undefined) updateData.outcomes = ncpData.outcomes
    if (ncpData.interventions !== undefined)
      updateData.interventions = ncpData.interventions
    if (ncpData.rationale !== undefined)
      updateData.rationale = ncpData.rationale
    if (ncpData.implementation !== undefined)
      updateData.implementation = ncpData.implementation
    if (ncpData.evaluation !== undefined)
      updateData.evaluation = ncpData.evaluation

    const { data, error } = await supabase
      .from('ncps')
      .update(updateData)
      .eq('id', ncpId)
      .eq('user_id', user.id)
      .select()

    if (error) throw error
    return data[0]
  },

  async getUserNCPs() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('ncps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getNCPById(ncpId) {
    const { data, error } = await supabase
      .from('ncps')
      .select('*')
      .eq('id', ncpId)
      .single()
    if (error) throw error
    return data
  },

  async renameNCP(ncpId, newTitle) {
    const { error } = await supabase
      .from('ncps')
      .update({ title: newTitle })
      .eq('id', ncpId)
    if (error) throw error
  },

  async deleteNCP(ncpId) {
    const { error } = await supabase.from('ncps').delete().eq('id', ncpId)
    if (error) throw error
  },

  async parseManualAssessment(manualData) {
    try {
      console.log('Parsing manual assessment data:', manualData)

      const response = await axios.post(
        `${API_BASE_URL}/api/parse-manual-assessment`,
        manualData,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )

      return response.data
    } catch (error) {
      console.error(
        'Manual Assessment Parsing Error:',
        error.response?.data || error
      )

      const errorDetail = error.response?.data?.detail
      let errorMessage = 'Failed to parse manual assessment'

      if (errorDetail) {
        if (typeof errorDetail === 'string') {
          errorMessage = errorDetail
        } else if (errorDetail.message && errorDetail.error) {
          errorMessage = `error: ${errorDetail.error}`
          if (errorDetail.suggestion) {
            errorMessage += ` suggestion: ${errorDetail.suggestion}`
          }
        } else if (errorDetail.message) {
          errorMessage = errorDetail.message
        }
      }

      throw new Error(errorMessage)
    }
  },
}
