import { adminService } from '@/services/adminService'
import { computed, ref } from 'vue'
import { useAuth } from './useAuth'

const isAdminUser = ref(false)
const adminLevel = ref(null)
const adminCheckLoading = ref(true)

export const useAdmin = () => {
  const { isAuthenticated, user } = useAuth()

  const isAdmin = computed(() => {
    if (!isAuthenticated.value) return false
    return isAdminUser.value
  })

  const isSuperAdmin = computed(() => {
    if (!isAuthenticated.value || !isAdminUser.value) return false
    return adminLevel.value === 'super'
  })

  const checkAdminStatus = async () => {
    if (!isAuthenticated.value) {
      isAdminUser.value = false
      adminLevel.value = null
      adminCheckLoading.value = false
      return
    }

    try {
      adminCheckLoading.value = true
      isAdminUser.value = await adminService.isAdmin()

      // Get admin level from user metadata
      if (isAdminUser.value && user.value) {
        adminLevel.value = user.value.user_metadata?.admin_level || 'regular'
      } else {
        adminLevel.value = null
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      isAdminUser.value = false
      adminLevel.value = null
    } finally {
      adminCheckLoading.value = false
    }
  }

  return {
    isAdmin,
    isSuperAdmin,
    adminLevel: computed(() => adminLevel.value),
    adminCheckLoading: computed(() => adminCheckLoading.value),
    checkAdminStatus,
  }
}
