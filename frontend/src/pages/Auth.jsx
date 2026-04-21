import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { user, signIn, signUp, sendMagicLink, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/dashboard'

  const [activeTab, setActiveTab] = useState('Sign In')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [magicSent, setMagicSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // If already logged in, redirect away
  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user])

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'Sign In') {
        await signIn(email, password)
        // navigation handled by useEffect above
      } else {
        await signUp(email, password)
        setError(null)
        // Show success message
        setError('Account created! Please check your email to confirm, then sign in.')
      }
    } catch (err) {
      // Clean up Supabase error messages
      const msg = err.message || 'Something went wrong.'
      if (err.message) {
        setError(err.message === 'User already registered'
          ? 'An account with this email already exists. Try signing in.' 
          : err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not sign in with Google.')
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('Enter your email first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await sendMagicLink(email)
      setMagicSent(true)
    } catch (err) {
      setError(err.message || 'Could not send magic link.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const inputStyle = {
    width: '100%',
    padding: '13px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(0,0,0,0.12)',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 15,
    color: '#1A1714',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 150ms',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--mesh-auth)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255,252,248,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: 28,
        padding: '48px 40px 40px',
        boxShadow: '0 12px 40px rgba(201,107,46,0.15), 0 2px 12px rgba(0,0,0,0.08)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#C96B2E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 20,
            margin: '0 auto 12px',
          }}>S</div>
          <span style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 28,
            fontWeight: 300,
            color: '#1A1714',
          }}>Sol</span>
        </div>

        {/* Tab toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 999,
          padding: 4,
          marginBottom: 32,
        }}>
          {['Sign In', 'Sign Up'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError(null); setMagicSent(false) }}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 999,
                border: 'none',
                background: activeTab === tab ? 'white' : 'transparent',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                fontWeight: activeTab === tab ? 500 : 400,
                color: activeTab === tab ? '#1A1714' : '#6B6560',
                cursor: 'pointer',
                transition: 'all 150ms',
                boxShadow: activeTab === tab
                  ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >{tab}</button>
          ))}
        </div>

        {magicSent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300,
                        fontSize: 22, marginBottom: 8 }}>
              Check your email
            </h3>
            <p style={{ color: '#6B6560', fontSize: 14, lineHeight: 1.6 }}>
              We sent a sign-in link to <strong>{email}</strong>.
              Click it to log in instantly.
            </p>
            <button
              onClick={() => setMagicSent(false)}
              style={{ marginTop: 20, background: 'none', border: 'none',
                      color: '#C96B2E', cursor: 'pointer', fontSize: 14,
                      fontFamily: 'DM Sans, sans-serif' }}
            >← Try a different email</button>
          </div>
        ) : (
          <>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="email"
                autoFocus
                style={inputStyle}
                onFocus={e => e.target.style.borderBottomColor = '#C96B2E'}
                onBlur={e => e.target.style.borderBottomColor = 'rgba(0,0,0,0.12)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28, position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete={activeTab === 'Sign In'
                  ? 'current-password' : 'new-password'}
                style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={e => e.target.style.borderBottomColor = '#C96B2E'}
                onBlur={e => e.target.style.borderBottomColor = 'rgba(0,0,0,0.12)'}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9E8E7E',
                  fontSize: 13,
                  fontFamily: 'DM Sans, sans-serif',
                  padding: '4px 8px',
                }}
              >{showPassword ? 'Hide' : 'Show'}</button>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 10,
                background: error.includes('created')
                  ? 'rgba(61,122,95,0.08)' : 'rgba(192,57,43,0.08)',
                border: `1px solid ${error.includes('created')
                  ? 'rgba(61,122,95,0.2)' : 'rgba(192,57,43,0.2)'}`,
                fontSize: 13,
                color: error.includes('created') ? '#3D7A5F' : '#C0392B',
                lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-mesh"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 15,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? (activeTab === 'Sign In' ? 'Signing in...' : 'Creating account...')
                : (activeTab === 'Sign In' ? 'Sign In' : 'Create Account')}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 24,
              marginBottom: 16,
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', width: '100%', height: 1, background: '#E8E3DD' }} />
              <span style={{ background: 'white', padding: '0 12px', fontSize: 13, color: '#9E8E7E', position: 'relative', zIndex: 1 }}>or continue with</span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                border: '1px solid #E8E3DD',
                background: 'white',
                color: '#1A1714',
                fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'background 0.2s',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={e => e.target.style.background = '#F9F7F4'}
              onMouseLeave={e => e.target.style.background = 'white'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            <p style={{
              textAlign: 'center',
              marginTop: 18,
              fontSize: 13,
              color: '#9E8E7E',
            }}>
              or{' '}
              <button
                onClick={handleMagicLink}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C96B2E',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                send me a sign-in link
              </button>
            </p>

            <p style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 12,
              color: '#C8C3BD',
              lineHeight: 1.8,
            }}>
              By continuing you agree to our{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#9E8E7E', textDecoration: 'underline' }}
              >Terms of Service</a>
              {' '}and{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#9E8E7E', textDecoration: 'underline' }}
              >Privacy Policy</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
