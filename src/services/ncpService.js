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
        // Save the original structured JSON to Supabase
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await this.saveStructuredNCP(result.ncp, result, assessmentData)
        }

        return {
          diagnosis: result,
          ncp: result.ncp, // Return the original structured JSON
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
