import router from '@/router'
import axios from 'axios'
import { supabase } from './supabase'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async config => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle suspension
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    // Check if user is suspended
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'ACCOUNT_SUSPENDED'
    ) {
      // Sign out the user
      await supabase.auth.signOut()

      // Redirect to login with suspension message
      router.push({
        path: '/login',
        query: {
          suspended: 'true',
          message: error.response.data.message,
        },
      })

      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
