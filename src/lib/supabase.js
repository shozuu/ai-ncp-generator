import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const getProjectRef = url => {
  try {
    const hostname = new URL(url).hostname
    return hostname.split('.')[0] || 'default'
  } catch {
    return 'default'
  }
}

const storageKey = `sb-${getProjectRef(supabaseUrl)}-auth-token`

let hasHandledRefreshFetchFailure = false
let supabaseClient

const supabaseFetch = async (input, init) => {
  try {
    return await fetch(input, init)
  } catch (error) {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input?.url || ''

    const isRefreshTokenRequest =
      requestUrl.includes('/auth/v1/token') &&
      requestUrl.includes('grant_type=refresh_token')

    if (isRefreshTokenRequest && !hasHandledRefreshFetchFailure) {
      hasHandledRefreshFetchFailure = true

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(storageKey)
          window.sessionStorage.removeItem(storageKey)
        } catch {
          // no-op
        }
      }

      queueMicrotask(() => {
        supabaseClient?.auth?.signOut({ scope: 'local' }).catch(() => {
          // no-op
        })
      })

      console.warn(
        '[Supabase] Token refresh failed due to a network/DNS error. Cleared local session to prevent repeated refresh attempts.'
      )
    }

    throw error
  }
}

supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetch,
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey,
  },
})

export const supabase = supabaseClient
