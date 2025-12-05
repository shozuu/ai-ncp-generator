import axios from '@/lib/axios'
import { supabase } from '@/lib/supabase'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const adminService = {
  /**
   * Check if current user is an admin
   */
  async isAdmin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      // Check if user has admin role in user_metadata or app_metadata
      const isAdmin =
        user.user_metadata?.is_admin || user.app_metadata?.is_admin || false
      return isAdmin
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  },

  /**
   * Get authentication headers with Bearer token
   */
  async getAuthHeaders() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session')
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
    }
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/dashboard-stats`,
        { headers }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  },

  /**
   * Get all users with their statistics
   */
  async getUsers() {
    try {
      const headers = await this.getAuthHeaders()
      // First, get all users from auth.users (via admin API)
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers,
      })
      return response.data
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  /**
   * Update user status (suspend/activate)
   */
  async updateUserStatus(userId, suspended) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/users/${userId}/status`,
        { suspended },
        { headers }
      )
      return response.data
    } catch (error) {
      console.error('Error updating user status:', error)
      throw error
    }
  },

  /**
   * Delete a user
   */
  async deleteUser(userId) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/users/${userId}`,
        { headers }
      )
      return response.data
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },

  /**
   * Update user admin role (promote/demote)
   */
  async updateAdminRole(userId, isAdmin, adminLevel = 'regular') {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/users/${userId}/admin-role`,
        { is_admin: isAdmin, admin_level: adminLevel },
        { headers }
      )
      return response.data
    } catch (error) {
      console.error('Error updating admin role:', error)
      throw error
    }
  },

  /**
   * Get system health status
   */
  async getSystemHealth() {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.get(`${API_BASE_URL}/api/admin/health`, {
        headers,
      })
      return response.data
    } catch (error) {
      console.error('Error fetching system health:', error)
      throw error
    }
  },

  /**
   * Get all NCPs (for admin view)
   */
  async getAllNCPs(params = {}) {
    try {
      const headers = await this.getAuthHeaders()
      const queryParams = new URLSearchParams(params).toString()
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/ncps${queryParams ? '?' + queryParams : ''}`,
        { headers }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching all NCPs:', error)
      throw error
    }
  },

  /**
   * Delete an NCP
   */
  async deleteNCP(ncpId) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/ncps/${ncpId}`,
        { headers }
      )
      return response.data
    } catch (error) {
      console.error('Error deleting NCP:', error)
      throw error
    }
  },

  /**
   * Get analytics data
   */
  async getAnalytics(period = '30d') {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.get(`${API_BASE_URL}/api/admin/analytics`, {
        params: { period },
        headers,
      })
      return response.data
    } catch (error) {
      console.error('Error fetching analytics:', error)
      throw error
    }
  },

  /**
   * Get current AI provider configuration
   */
  async getAIProvider() {
    try {
      const headers = await this.getAuthHeaders()
      console.log(
        '[adminService] Fetching AI provider from:',
        `${API_BASE_URL}/api/admin/ai-provider`
      )
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/ai-provider`,
        {
          headers,
        }
      )
      console.log('[adminService] AI provider response:', response.data)
      return response.data.data // Extract data from nested structure
    } catch (error) {
      console.error('[adminService] Error fetching AI provider:', error)
      console.error('[adminService] Error response:', error.response?.data)
      throw error
    }
  },

  /**
   * Switch AI provider (Claude or Gemini)
   */
  async switchAIProvider(provider) {
    try {
      const headers = await this.getAuthHeaders()
      console.log('[adminService] Switching AI provider to:', provider)
      console.log(
        '[adminService] API endpoint:',
        `${API_BASE_URL}/api/admin/ai-provider/switch`
      )
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/ai-provider/switch`,
        { provider },
        { headers }
      )
      console.log('[adminService] Switch response:', response.data)
      return response.data.data // Extract data from nested structure
    } catch (error) {
      console.error('[adminService] Error switching AI provider:', error)
      console.error('[adminService] Error response:', error.response?.data)
      console.error('[adminService] Error status:', error.response?.status)
      throw error
    }
  },
}
