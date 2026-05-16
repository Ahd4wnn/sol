import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import { getReferral, setPromoCode, clearReferral } from '../lib/referral'

const TAGLINES = [
  {
    pre: "You don't have to",
    main: "figure it out alone.",
  },
  {
    pre: "Someone is here",
    main: "at 3am too.",
  },
  {
    pre: "Your mind deserves",
    main: "a real conversation.",
  },
  {
    pre: "Stop performing",
    main: "okay.",
  },
]

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(
    searchParams.get('mode') === 'register'
      ? 'register'
      : 'login'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [promoCode, setPromoCodeState] = useState('')
  const [promoValid, setPromoValid] = useState(null)
  const [promoData, setPromoData] = useState(null)
  const [checkingPromo, setCheckingPromo] = useState(false)
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [taglineFade, setTaglineFade] = useState(true)

  // Rotate taglines every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineFade(false)
      setTimeout(() => {
        setTaglineIndex(i => (i + 1) % TAGLINES.length)
        setTaglineFade(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Pre-fill promo from URL ref
  useEffect(() => {
    const ref = getReferral()
    if (ref?.source === 'code') setPromoCodeState(ref.value)
  }, [])

  const handlePromoCheck = async (code) => {
    if (!code || code.length < 4) return
    setCheckingPromo(true)
    try {
      const { data } = await api.get(
        `/api/creators/validate-code/${code}`
      )
      setPromoValid(true)
      setPromoData(data)
      setPromoCode(code)
    } catch {
      setPromoValid(false)
      setPromoData(null)
    } finally {
      setCheckingPromo(false)
    }
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (mode === 'login') {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          })
        if (signInError) throw signInError
        navigate('/dashboard')

      } else {
        const { error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
          })
        if (signUpError) throw signUpError

        // Apply referral if present
        const referral = getReferral()
        if (referral || (promoCode && promoValid)) {
          try {
            await api.post('/api/profile/apply-referral', {
              source: referral?.source || 'code',
              value: referral?.value || promoCode,
            })
            clearReferral()
          } catch (err) {
            console.warn('Referral apply failed:', err)
          }
        }

        navigate('/onboarding')
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) {
        setError('Wrong email or password.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Please confirm your email first.')
      } else if (msg.includes('User already registered')) {
        setError('Account exists. Log in instead.')
        setMode('login')
      } else {
        setError(msg || 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError(null)
    setPassword('')
  }

  const tagline = TAGLINES[taglineIndex]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F0EBE5',
      padding: 20,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 900,
        minHeight: 560,
        display: 'flex',
        borderRadius: 28,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
        background: 'white',
      }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          flex: '0 0 42%',
          background: `
            radial-gradient(ellipse at 20% 50%, #E8874A 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, #C96B2E 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, #F4A460 0%, transparent 55%),
            radial-gradient(ellipse at 10% 90%, #D4724A 0%, transparent 40%),
            #C96B2E
          `,
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="auth-left-panel"
        >
          {/* Animated blobs */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(circle at 30% 40%, rgba(255,200,150,0.35) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(180,80,30,0.3) 0%, transparent 45%)
            `,
            animation: 'meshFloat 8s ease-in-out infinite alternate',
          }} />

          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            position: 'relative',
            zIndex: 2,
          }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'white',
            }}>S</div>
            <span style={{
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 20,
              fontWeight: 300,
              color: 'white',
            }}>Sol</span>
          </div>

          {/* Tagline */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            opacity: taglineFade ? 1 : 0,
            transform: taglineFade
              ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 400ms ease, transform 400ms ease',
          }}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              color: 'rgba(255,255,255,0.75)',
              marginBottom: 6,
              fontWeight: 400,
            }}>
              {tagline.pre}
            </p>
            <h2 style={{
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 'clamp(22px, 3vw, 30px)',
              fontWeight: 300,
              color: 'white',
              lineHeight: 1.2,
              margin: 0,
            }}>
              {tagline.main}
            </h2>
          </div>

          {/* Bottom note */}
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            position: 'relative',
            zIndex: 2,
            margin: 0,
          }}>
            Free to start · No credit card
          </p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          flex: 1,
          padding: 'clamp(32px, 6vw, 52px) clamp(24px, 6vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'white',
        }}>

          {/* Sol mark */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(201,107,46,0.1)',
            border: '1.5px solid rgba(201,107,46,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <span style={{
              color: '#C96B2E',
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 14,
            }}>✦</span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            color: '#0F0D0B',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}>
            {mode === 'login'
              ? 'Log in'
              : 'Create an account'}
          </h1>

          <p style={{
            fontSize: 14,
            color: '#9E8E7E',
            margin: '0 0 32px',
            lineHeight: 1.5,
          }}>
            {mode === 'login'
              ? 'Welcome back. Sol remembers you.'
              : 'Free to start. No credit card needed.'}
          </p>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(192,57,43,0.07)',
              border: '1px solid rgba(192,57,43,0.2)',
              fontSize: 13,
              color: '#C0392B',
              marginBottom: 20,
            }}>{error}</div>
          )}

          {/* Email field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#4A4541',
              marginBottom: 6,
            }}>
              Your email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="you@university.edu"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1.5px solid #E8E3DD',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15,
                color: '#0F0D0B',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 150ms',
                background: '#FAFAF9',
              }}
              onFocus={e =>
                e.target.style.borderColor = '#C96B2E'
              }
              onBlur={e =>
                e.target.style.borderColor = '#E8E3DD'
              }
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: mode === 'register' ? 16 : 24 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#4A4541',
              marginBottom: 6,
            }}>
              {mode === 'login' ? 'Password' : 'Create password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #E8E3DD',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 15,
                  color: '#0F0D0B',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms',
                  background: '#FAFAF9',
                }}
                onFocus={e =>
                  e.target.style.borderColor = '#C96B2E'
                }
                onBlur={e =>
                  e.target.style.borderColor = '#E8E3DD'
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9E8E7E',
                  fontSize: 13,
                  padding: 0,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {showPassword ? 'hide' : 'show'}
              </button>
            </div>
          </div>

          {/* Promo code — register only */}
          {mode === 'register' && (
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#4A4541',
                marginBottom: 6,
              }}>
                Promo code{' '}
                <span style={{
                  color: '#C8C3BD',
                  fontWeight: 400,
                }}>
                  (optional)
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => {
                    const val = e.target.value.toUpperCase()
                    setPromoCodeState(val)
                    setPromoValid(null)
                    if (val.length >= 4) handlePromoCheck(val)
                  }}
                  placeholder="FRIEND20"
                  style={{
                    width: '100%',
                    padding: '12px 80px 12px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${
                      promoValid === true ? '#3D7A5F'
                      : promoValid === false ? '#C0392B'
                      : '#E8E3DD'
                    }`,
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 15,
                    color: '#0F0D0B',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#FAFAF9',
                    letterSpacing: promoCode ? '0.06em' : 0,
                    fontWeight: promoCode ? 600 : 400,
                    transition: 'border-color 150ms',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: promoValid === true ? '#3D7A5F'
                    : promoValid === false ? '#C0392B'
                    : '#C8C3BD',
                }}>
                  {checkingPromo ? 'checking...'
                    : promoValid === true ? '✓ valid'
                    : promoValid === false ? 'invalid'
                    : ''}
                </span>
              </div>
              {promoData && (
                <div style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(61,122,95,0.07)',
                  border: '1px solid rgba(61,122,95,0.2)',
                  fontSize: 12,
                  color: '#3D7A5F',
                  fontWeight: 500,
                }}>
                  🎉 {promoData.message}
                </div>
              )}
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: loading
                ? '#D4A882'
                : '#0F0D0B',
              color: 'white',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              transition: 'all 150ms',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => {
              if (!loading)
                e.currentTarget.style.background = '#C96B2E'
            }}
            onMouseLeave={e => {
              if (!loading)
                e.currentTarget.style.background = '#0F0D0B'
            }}
          >
            {loading
              ? 'Just a moment...'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </button>

          {/* Mode switch */}
          <p style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 14,
            color: '#9E8E7E',
          }}>
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C96B2E',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C96B2E',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}
                >
                  Log in
                </button>
              </>
            )}
          </p>

          {/* Legal */}
          <p style={{
            textAlign: 'center',
            marginTop: 16,
            fontSize: 11,
            color: '#C8C3BD',
            lineHeight: 1.6,
          }}>
            By continuing you agree to our{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9E8E7E' }}
            >
              Terms
            </a>
            {' '}and{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9E8E7E' }}
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes meshFloat {
          0% {
            transform: scale(1) translate(0, 0);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.08) translate(2%, -2%);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .auth-left-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
