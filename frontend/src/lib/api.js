import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000, 
})

api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✓ ${response.config.url} →`, response.status)
    return response
  },
  (error) => {
    const status = error.response?.status
    const url = error.config?.url
    const message = error.response?.data?.message || error.message

    console.error(`[API] ✗ ${url} → ${status}:`, message)

    if (status === 401) {
      console.warn('[API] 401 Unauthorized — signing out')
      supabase.auth.signOut().finally(() => {
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth'
        }
      })
    }

    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timed out:', url)
    }

    return Promise.reject(error)
  }
)

export default api
