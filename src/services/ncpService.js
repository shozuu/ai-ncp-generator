import axios from '@/lib/axios'
import { supabase } from '@/lib/supabase'
import { generateDefaultNCPTitle } from '@/utils/structuredNCPUtils'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ============================================================================
// FRONTEND NCP GENERATION SERVICE (ORCHESTRATES API CALLS) - START
// ============================================================================
export const ncpService = {
  /**
   * Generate a comprehensive Nursing Care Plan (NCP) with diagnosis selection
   *
   * This is the main entry point for NCP generation. It orchestrates the entire
   * process from assessment data to saved NCP.
   *
   * @param {Object} assessmentData - Structured patient assessment data
   * @param {AbortSignal} abortSignal - Optional signal to cancel the request
   * @returns {Promise<Object>} Object containing diagnosis, NCP, and saved ID
   *
   * Workflow:
   * 1. Send assessment data to backend API endpoint
   * 2. Backend performs vector search for diagnosis candidates
   * 3. AI selects best diagnosis and generates complete NCP
   * 4. Frontend automatically saves NCP to Supabase database
   * 5. Returns diagnosis result, NCP structure, and database ID
   *
   * Error Handling:
   * - Validates response structure
   * - Extracts detailed error messages from API
   * - Provides user-friendly suggestions for failures
   */
  async generateComprehensiveNCP(assessmentData, abortSignal = null) {
    try {
      const config = {
        headers: { 'Content-Type': 'application/json' },
      }

      // Add abort signal if provided (allows user to cancel long-running requests)
      if (abortSignal) {
        config.signal = abortSignal
      }

      // Send POST request to backend diagnosis + NCP generation endpoint
      const response = await axios.post(
        `${API_BASE_URL}/api/suggest-diagnoses`,
        assessmentData,
        config
      )

      const result = response.data

      // Check if complete NCP was generated (not just diagnosis)
      if (result.ncp) {
        // Get currently authenticated user for database operations
        const {
          data: { user },
        } = await supabase.auth.getUser()

        let savedNCP = null

        // Only save if user is authenticated
        if (user) {
          // Automatically save the generated NCP to database
          savedNCP = await this.saveStructuredNCP(
            result.ncp, // Generated NCP structure
            result, // Full diagnosis result
            assessmentData // Original assessment for reference
          )
        }

        // Return comprehensive result object
        return {
          diagnosis: result, // Diagnosis selection details
          ncp: result.ncp, // Complete NCP structure
          savedNCPId: savedNCP?.id, // Database ID for future reference
        }
      } else {
        // Only diagnosis was generated (NCP generation failed or wasn't requested)
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

      // Extract detailed error information from API response
      const errorDetail = error.response?.data?.detail
      let errorMessage = 'Failed to generate diagnosis and NCP'
      let suggestion = ''

      // Parse error structure (can be string or object)
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

      // Combine error message with actionable suggestion
      let finalMessage = errorMessage
      if (suggestion) {
        finalMessage += ` ${suggestion}`
      }

      // Throw user-friendly error for UI display
      throw new Error(finalMessage)
    }
  },
  // ============================================================================
  // FRONTEND NCP GENERATION SERVICE (ORCHESTRATES API CALLS) - END
  // ============================================================================

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
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getNCPById(ncpId) {
    const { data, error } = await supabase
      .from('ncps')
      .select('*')
      .eq('id', ncpId)
      .eq('is_deleted', false)
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

  async parseManualAssessment(manualData, abortSignal = null) {
    try {
      const config = {
        headers: { 'Content-Type': 'application/json' },
      }

      // Add abort signal if provided
      if (abortSignal) {
        config.signal = abortSignal
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/parse-manual-assessment`,
        manualData,
        config
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
