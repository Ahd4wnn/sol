import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
})

// Token cache — refresh every 4 minutes (tokens last 1 hour)
let tokenCache = { value: null, expiresAt: 0 }

async function getToken() {
  const now = Date.now()
  if (tokenCache.value && now < tokenCache.expiresAt) {
    return tokenCache.value
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    tokenCache = {
      value: session.access_token,
      expiresAt: now + 4 * 60 * 1000  // cache for 4 minutes
    }
    return session.access_token
  }
  return null
}

// Clear cache on sign out
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    tokenCache = { value: null, expiresAt: 0 }
  }
})

api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch (err) {
    console.error('[API] Token fetch failed:', err)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url

    if (status === 429) {
      console.warn('[API] Rate limit hit')
      return Promise.reject(error)
    }

    if (!error.response) {
      console.warn('[API] Network error — backend may be unreachable')
    }

    if (status === 401) {
      tokenCache = { value: null, expiresAt: 0 }
      // If we get a 401, the token is truly invalid on the backend.
      // We must sign out of Supabase to clear the bad local session.
      // We manually remove the local storage token first because signOut() 
      // can fail if the token is already expired on the server.
      localStorage.removeItem('sb-gjggujmxcmduleftuboi-auth-token')
      
      supabase.auth.signOut().catch(() => {}).finally(() => {
        if (!window.location.pathname.includes('/auth')) {
          window.location.href = '/auth'
        }
      })
    }

    return Promise.reject(error)
  }
)

export default api
