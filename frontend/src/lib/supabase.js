import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('[Supabase] Missing environment variables!', {
    VITE_SUPABASE_URL: url ? 'set' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: key ? 'set' : 'MISSING'
  })
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
