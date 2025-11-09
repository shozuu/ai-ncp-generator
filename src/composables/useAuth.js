import { supabase } from '@/lib/supabase'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const user = ref(null)
const loading = ref(true)

export const useAuth = () => {
  const router = useRouter()

  const isAuthenticated = computed(() => !!user.value)

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Check if user is suspended
    if (data?.user) {
      const isSuspended = data.user.user_metadata?.is_suspended || false
      if (isSuspended) {
        // Sign out immediately
        await supabase.auth.signOut()
        return {
          data: null,
          error: {
            message: 'Your account has been suspended. Please contact support.',
            status: 403,
          },
        }
      }
    }

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      user.value = null
      router.push('/login')
    }
    return { error }
  }

  const resetPassword = async email => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  const initAuth = async () => {
    loading.value = true
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if user is suspended
    if (session?.user) {
      const isSuspended = session.user.user_metadata?.is_suspended || false
      if (isSuspended) {
        await supabase.auth.signOut()
        user.value = null
        loading.value = false
        router.push('/login?suspended=true')
        return
      }
    }

    user.value = session?.user ?? null
    loading.value = false

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      // Check suspension status on any auth change
      if (session?.user) {
        const isSuspended = session.user.user_metadata?.is_suspended || false
        if (isSuspended) {
          await supabase.auth.signOut()
          user.value = null
          router.push('/login?suspended=true')
          return
        }
      }

      user.value = session?.user ?? null
      loading.value = false

      // Handle successful email confirmation
      if (event === 'SIGNED_IN' && session) {
        // User is now signed in after email confirmation
        console.log('User signed in via email confirmation')
      }
    })
  }

  return {
    user: computed(() => user.value),
    loading: computed(() => loading.value),
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    resetPassword,
    initAuth,
  }
}
