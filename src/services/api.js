import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.detail || error.message
    console.error('API Error:', message)
    throw new Error(message)
  }
)

export const ncpService = {
  /**
   * Generate a new NCP based on assessment data
   * @param {Object} assessmentData - The assessment data from the form
   * @returns {Promise} - The generated NCP data
   */
  generateNCP: async assessmentData => {
    try {
      const response = await api.post('/generate-ncp', assessmentData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate NCP')
    }
  },

  /**
   * Validate a manually created NCP
   * @param {Object} ncpData - The NCP data to validate
   * @returns {Promise} - The validation results
   */
  validateNCP: async ncpData => {
    try {
      const response = await api.post('/validate-ncp', ncpData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to validate NCP')
    }
  },
}
