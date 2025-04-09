import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const ncpService = {
  async generateNCP(assessmentData) {
    try {
      console.log('Sending assessment data:', assessmentData) // Debug log

      const response = await axios.post(
        `${API_BASE_URL}/api/generate-ncp`,
        assessmentData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return response.data
    } catch (error) {
      console.error('NCP Generation Error:', error.response?.data || error) // Debug log
      throw new Error(
        error.response?.data?.detail?.message ||
          error.response?.data?.detail ||
          'Failed to generate NCP'
      )
    }
  },
}
