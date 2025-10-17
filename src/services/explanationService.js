import { supabase } from '@/lib/supabase'
import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const explanationService = {
  async getNCPExplanation(ncpId) {
    const { data, error } = await supabase
      .from('ncp_explanations')
      .select('*')
      .eq('ncp_id', ncpId)
      .single()

    if (error) throw error
    return data
  },

  async generateExplanation(ncpId, abortSignal = null) {
    // First get the NCP data
    const { data: ncp, error: ncpError } = await supabase
      .from('ncps')
      .select('*')
      .eq('id', ncpId)
      .single()

    if (ncpError) throw ncpError

    // Call backend to generate explanation
    const config = {
      headers: { 'Content-Type': 'application/json' },
    }

    // Add abort signal if provided
    if (abortSignal) {
      config.signal = abortSignal
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/generate-explanation`,
      { ncp },
      config
    )

    const explanationData = response.data

    // Update the explanation in the database
    const { data, error } = await supabase
      .from('ncp_explanations')
      .update({ explanation: explanationData })
      .eq('ncp_id', ncpId)
      .select()

    if (error) throw error
    return data[0]
  },

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
