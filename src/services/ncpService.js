import { supabase } from '@/lib/supabase'
import { generateDefaultNCPTitle } from '@/utils/ncpUtils'
import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const ncpService = {
  async generateNCP(assessmentData) {
    try {
      console.log('Sending assessment data:', assessmentData) // debug log

      // generate ncp via existing fastapi
      const response = await axios.post(
        `${API_BASE_URL}/api/generate-ncp`,
        assessmentData,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const generatedNCP = response.data

      // save to supabase with the user's preferred format
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await this.saveNCP(generatedNCP, assessmentData)
      }

      return generatedNCP
    } catch (error) {
      console.error('NCP Generation Error:', error.response?.data || error) // debug log

      // Extract detailed error information from backend
      const errorDetail = error.response?.data?.detail
      let errorMessage = 'Failed to generate NCP'
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

      // Format the error message for frontend display
      let finalMessage = errorMessage
      if (suggestion) {
        finalMessage += ` ${suggestion}`
      }

      throw new Error(finalMessage)
    }
  },

  async saveNCP(ncpData, assessmentData, title = null) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Use the new default title function instead of date-based title
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

    // Only update editable columns (excluding assessment)
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
    // trigger the soft delete
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

      // Extract detailed error information from backend
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

  async suggestDiagnoses(assessmentData) {
    try {
      console.log(
        'Sending assessment data for diagnosis suggestion:',
        assessmentData
      )

      const response = await axios.post(
        `${API_BASE_URL}/api/suggest-diagnoses`,
        assessmentData,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const suggestedDiagnoses = response.data
      console.log('Received suggested diagnoses:', suggestedDiagnoses)

      return suggestedDiagnoses
    } catch (error) {
      console.error(
        'Diagnosis Suggestion Error:',
        error.response?.data || error
      )

      // Extract detailed error information from backend
      const errorDetail = error.response?.data?.detail
      let errorMessage = 'Failed to suggest diagnoses'
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

      // Format the error message for frontend display
      let finalMessage = errorMessage
      if (suggestion) {
        finalMessage += ` ${suggestion}`
      }

      throw new Error(finalMessage)
    }
  },
}
