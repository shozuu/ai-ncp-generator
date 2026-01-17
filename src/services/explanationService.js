import axios from '@/lib/axios'
import { supabase } from '@/lib/supabase'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ============================================================================
// MODULE 6 FRONTEND: EXPLANATION SERVICE (STEP 6 OF PIPELINE) - START
// ============================================================================
export const explanationService = {
  /**
   * Retrieve existing explanation for an NCP from the database.
   *
   * @param {string} ncpId - The unique identifier of the NCP
   * @returns {Promise<Object>} The explanation data from database
   */
  async getNCPExplanation(ncpId) {
    const { data, error } = await supabase
      .from('ncp_explanations')
      .select('*')
      .eq('ncp_id', ncpId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Generate educational explanations for an NCP using AI.
   *
   * This is the FRONTEND ENTRY POINT for Step 6 of the pipeline.
   * It fetches the NCP data and sends it to the backend for
   * AI-powered explanation generation.
   *
   * The generated explanations include three levels for each NCP section:
   * 1. Clinical Reasoning - Why decisions were made
   * 2. Evidence-Based Support - Research and guidelines
   * 3. Student Guidance - Learning guidance for nursing students
   *
   * @param {string} ncpId - The unique identifier of the NCP to explain
   * @param {AbortSignal} abortSignal - Optional signal to cancel request
   * @returns {Promise<Object>} The generated explanations saved to database
   */
  async generateExplanation(ncpId, abortSignal = null) {
    // First, retrieve the complete NCP data from database
    // Only generate explanations for NCPs that haven't been deleted
    const { data: ncp, error: ncpError } = await supabase
      .from('ncps')
      .select('*')
      .eq('id', ncpId)
      .eq('is_deleted', false)
      .single()

    if (ncpError) throw ncpError

    // Call backend API to generate AI-powered explanations
    const config = {
      headers: { 'Content-Type': 'application/json' },
    }

    // Add abort signal if provided (allows cancellation of long requests)
    if (abortSignal) {
      config.signal = abortSignal
    }

    // Send NCP to backend for explanation generation
    const response = await axios.post(
      `${API_BASE_URL}/api/generate-explanation`,
      { ncp },
      config
    )

    const explanationData = response.data

    // Save the generated explanations to the database
    // Updates the existing ncp_explanations record for this NCP
    const { data, error } = await supabase
      .from('ncp_explanations')
      .update({ explanation: explanationData })
      .eq('ncp_id', ncpId)
      .select()

    if (error) throw error
    return data[0]
  },

  /**
   * Check if an NCP already has explanations generated.
   *
   * Used to determine whether to show "Generate" or "View" button
   * in the UI, avoiding unnecessary regeneration.
   *
   * @param {string} ncpId - The unique identifier of the NCP
   * @returns {Promise<boolean>} True if explanations exist
   */
  async hasExplanation(ncpId) {
    const { data, error } = await supabase
      .from('ncp_explanations')
      .select('explanation')
      .eq('ncp_id', ncpId)
      .single()

    if (error) throw error

    // Check if explanation object has any meaningful content
    return data.explanation && Object.keys(data.explanation).length > 0
  },
}
// ============================================================================
// MODULE 6 FRONTEND: EXPLANATION SERVICE (STEP 6 OF PIPELINE) - END
// ============================================================================
