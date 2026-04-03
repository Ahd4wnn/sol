import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileFetchedFor = useRef(null) // track which user we fetched profile for

  // Fetch profile ONCE per user — never re-fetch unless user changes
  const fetchProfile = async (userId) => {
    if (!userId) return
    if (profileFetchedFor.current === userId) return // already fetched
    profileFetchedFor.current = userId
    try {
      const { data } = await api.get('/api/profile/me')
      setProfile(data)
    } catch (err) {
      console.error('[AuthContext] Profile fetch failed:', err)
      profileFetchedFor.current = null // allow retry
    }
  }

  useEffect(() => {
    let mounted = true

    // Step 1: Get initial session synchronously
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return
      if (error) {
        console.error('[AuthContext] getSession error:', error)
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    // Step 2: Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        console.log('[AuthContext] Auth event:', event)

        setSession(session)
        setUser(session?.user ?? null)

        if (event === 'SIGNED_IN' && session?.user) {
          fetchProfile(session.user.id)
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null)
          profileFetchedFor.current = null
        }

        // Only update loading for initial events
        if (event === 'INITIAL_SESSION') {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // ← empty array, runs once only

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    profileFetchedFor.current = null
  }

  const sendMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: window.location.origin,
      }
    })
    if (error) throw error
  }

  const refreshProfile = async () => {
    profileFetchedFor.current = null // force re-fetch
    if (user?.id) await fetchProfile(user.id)
  }

  // Loading screen — shown while we check auth state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9F7F4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#C96B2E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontSize: 22,
          animation: 'solPulse 1.8s ease-in-out infinite',
        }}>S</div>
        <p style={{ color: '#9E8E7E', fontSize: 14 }}>Loading Sol...</p>
        <style>{`
          @keyframes solPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.65; transform: scale(0.93); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      sendMagicLink,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
