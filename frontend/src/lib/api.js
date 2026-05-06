import axios from 'axios'
import { supabase } from './supabase'

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
let finalBaseUrl = rawBaseUrl

// Prevent duplicate /api/api/... paths
// If user sets VITE_API_URL to 'api' or '/api', we set baseURL to empty string 
// because all our endpoints already start with '/api/'
if (finalBaseUrl === 'api' || finalBaseUrl === '/api' || finalBaseUrl === '/api/' || finalBaseUrl === 'api/') {
  finalBaseUrl = ''
} else if (finalBaseUrl.endsWith('/api')) {
  finalBaseUrl = finalBaseUrl.slice(0, -4)
} else if (finalBaseUrl.endsWith('/api/')) {
  finalBaseUrl = finalBaseUrl.slice(0, -5)
}

const api = axios.create({
  baseURL: finalBaseUrl,
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
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth'
      }
    }

    return Promise.reject(error)
  }
)

export default api
