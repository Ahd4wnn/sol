import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import { getReferral, setPromoCode, clearReferral } from '../lib/referral'

// Left panel slides — each tells one part of Sol's story
const SLIDES = [
  {
    eyebrow: "You don't have to",
    headline: "figure it out\nalone.",
    sub: "Sol is here whenever you need to talk — no appointments, no judgment.",
    stat: null,
  },
  {
    eyebrow: "Available",
    headline: "at 3am.",
    sub: "Most hard moments don't happen at convenient times. Sol doesn't keep office hours.",
    stat: null,
  },
  {
    eyebrow: "8 different ways",
    headline: "to be heard.",
    sub: "From a warm friend to a no-nonsense coach — choose the voice that actually helps you.",
    stat: null,
  },
  {
    eyebrow: "Built on real",
    headline: "therapy methods.",
    sub: "CBT, DBT, ACT — not vibes. Sol uses techniques that actually work.",
    stat: null,
  },
  {
    eyebrow: "Your thoughts",
    headline: "stay yours.",
    sub: "Everything you share is private, encrypted, and never used for advertising.",
    stat: null,
  },
]

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
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

  // Slide state
  const [slideIndex, setSlideIndex] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSlideIndex(i => (i + 1) % SLIDES.length)
    }, 4500)
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    const ref = getReferral()
    if (ref?.source === 'code') setPromoCodeState(ref.value)
  }, [])

  const goToSlide = (index) => {
    clearInterval(intervalRef.current)
    setSlideIndex(index)
    intervalRef.current = setInterval(() => {
      setSlideIndex(i => (i + 1) % SLIDES.length)
    }, 4500)
  }

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
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })
        if (err) throw err
        navigate('/dashboard')
      } else {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        })
        if (err) throw err
        const referral = getReferral()
        if (referral || (promoCode && promoValid)) {
          try {
            await api.post('/api/profile/apply-referral', {
              source: referral?.source || 'code',
              value: referral?.value || promoCode,
            })
            clearReferral()
          } catch {}
        }
        navigate('/onboarding')
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials'))
        setError('Wrong email or password.')
      else if (msg.includes('User already registered')) {
        setError('Account exists. Log in instead.')
        setMode('login')
      } else setError(msg || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setError(null)
    setPassword('')
  }

  const slide = SLIDES[slideIndex]

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
        }

        .auth-root {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          font-family: 'DM Sans', sans-serif;
          background: #F9F7F4;
        }

        /* ── LEFT PANEL ── */
        .auth-left {
          position: relative;
          flex: 0 0 45%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          overflow: hidden;
          background: #C96B2E;
        }

        .auth-left-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 30%,
              rgba(255,210,170,0.45) 0%, transparent 65%),
            radial-gradient(ellipse 60% 70% at 80% 70%,
              rgba(160,60,15,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 90% 50% at 50% 100%,
              rgba(180,75,20,0.4) 0%, transparent 55%),
            radial-gradient(ellipse 70% 40% at 90% 10%,
              rgba(230,140,70,0.35) 0%, transparent 50%);
          animation: bgPulse 10s ease-in-out infinite alternate;
        }

        @keyframes bgPulse {
          0% { opacity: 0.85; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.04); }
        }

        .auth-left-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .auth-logo-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 1.5px solid rgba(255,255,255,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 14px;
          color: white;
          backdrop-filter: blur(8px);
        }

        .auth-logo-name {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-weight: 300;
          font-size: 22px;
          color: white;
        }

        /* Slide content */
        .auth-slide {
          animation: slideEnter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes slideEnter {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-slide-eyebrow {
          font-size: 14px;
          color: rgba(255,255,255,0.65);
          font-weight: 400;
          margin-bottom: 8px;
          letter-spacing: 0.01em;
          animation: slideEnter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 0ms;
        }

        .auth-slide-headline {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-weight: 300;
          font-size: clamp(30px, 3.5vw, 44px);
          color: white;
          line-height: 1.1;
          margin-bottom: 16px;
          white-space: pre-line;
          animation: slideEnter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 60ms;
        }

        .auth-slide-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          line-height: 1.65;
          max-width: 320px;
          animation: slideEnter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 120ms;
        }

        /* Slide dots */
        .auth-dots {
          display: flex;
          gap: 8px;
          margin-top: 32px;
        }

        .auth-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.3);
          cursor: pointer;
          transition: all 300ms ease;
          border: none;
          padding: 0;
        }

        .auth-dot.active {
          background: white;
          width: 20px;
        }

        .auth-left-footer {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.02em;
        }

        /* ── RIGHT PANEL ── */
        .auth-right {
          flex: 1;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          background: white;
          overflow-y: auto;
        }

        .auth-form-container {
          width: 100%;
          max-width: 400px;
        }

        .auth-form-mark {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(201,107,46,0.08);
          border: 1.5px solid rgba(201,107,46,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
          font-size: 16px;
        }

        .auth-heading {
          font-family: 'DM Sans', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #0F0D0B;
          margin: 0 0 6px;
          letter-spacing: -0.025em;
        }

        .auth-subheading {
          font-size: 14px;
          color: #9E8E7E;
          margin: 0 0 32px;
          line-height: 1.5;
        }

        .auth-field {
          margin-bottom: 16px;
        }

        .auth-field:last-of-type {
          margin-bottom: 24px;
        }

        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #3D3733;
          margin-bottom: 7px;
          letter-spacing: -0.01em;
        }

        .auth-label span {
          color: #BDB5AD;
          font-weight: 400;
        }

        .auth-input-wrap {
          position: relative;
        }

        .auth-input {
          width: 100%;
          padding: 13px 44px 13px 16px;
          border-radius: 10px;
          border: 1.5px solid #EDEAE6;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: #0F0D0B;
          outline: none;
          background: #FAFAF9;
          transition: border-color 180ms, box-shadow 180ms;
          -webkit-appearance: none;
        }

        .auth-input:focus {
          border-color: #C96B2E;
          box-shadow: 0 0 0 3px rgba(201,107,46,0.1);
          background: white;
        }

        .auth-input::placeholder {
          color: #C8C3BD;
        }

        .auth-input-action {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #9E8E7E;
          cursor: pointer;
          padding: 4px 0;
          letter-spacing: 0.01em;
        }

        .auth-input-action:hover {
          color: #C96B2E;
        }

        .auth-input-status {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: 600;
          pointer-events: none;
        }

        .auth-promo-success {
          margin-top: 8px;
          padding: 9px 13px;
          border-radius: 8px;
          background: rgba(61,122,95,0.07);
          border: 1px solid rgba(61,122,95,0.18);
          font-size: 13px;
          color: #3D7A5F;
          font-weight: 500;
        }

        .auth-error {
          padding: 11px 14px;
          border-radius: 10px;
          background: rgba(192,57,43,0.07);
          border: 1px solid rgba(192,57,43,0.18);
          font-size: 13px;
          color: #C0392B;
          margin-bottom: 20px;
          line-height: 1.4;
        }

        .auth-btn {
          width: 100%;
          padding: 15px;
          border-radius: 10px;
          border: none;
          background: #0F0D0B;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 180ms, transform 100ms;
          letter-spacing: -0.01em;
          -webkit-appearance: none;
        }

        .auth-btn:hover:not(:disabled) {
          background: #C96B2E;
        }

        .auth-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .auth-btn:disabled {
          background: #C8C3BD;
          cursor: default;
        }

        .auth-switch {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #9E8E7E;
        }

        .auth-switch-btn {
          background: none;
          border: none;
          color: #C96B2E;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .auth-legal {
          text-align: center;
          margin-top: 20px;
          font-size: 11px;
          color: #C8C3BD;
          line-height: 1.6;
        }

        .auth-legal a {
          color: #9E8E7E;
          text-decoration: none;
        }

        .auth-legal a:hover {
          color: #C96B2E;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .auth-root {
            flex-direction: column;
            min-height: 100vh;
          }

          .auth-left {
            flex: none;
            min-height: auto;
            padding: 32px 28px 36px;
          }

          .auth-left-content {
            gap: 28px;
          }

          .auth-slide-headline {
            font-size: 28px;
          }

          .auth-left-footer {
            display: none;
          }

          .auth-right {
            flex: 1;
            min-height: auto;
            padding: 36px 24px 48px;
            align-items: flex-start;
          }

          .auth-form-container {
            max-width: 100%;
          }

          .auth-form-mark {
            margin-bottom: 22px;
          }

          .auth-heading {
            font-size: 24px;
          }
        }

        @media (max-width: 380px) {
          .auth-left {
            padding: 28px 20px 28px;
          }
          .auth-right {
            padding: 28px 20px 40px;
          }
        }
      `}</style>

      <div className="auth-root">

        {/* ══ LEFT PANEL ══ */}
        <div className="auth-left">
          <div className="auth-left-bg" />
          <div className="auth-left-content">

            {/* Logo */}
            <a href="/" className="auth-logo">
              <div className="auth-logo-dot">S</div>
              <span className="auth-logo-name">Sol</span>
            </a>

            {/* Slide */}
            <div>
              <div
                key={slideIndex}
                className="auth-slide"
              >
                <p className="auth-slide-eyebrow">
                  {slide.eyebrow}
                </p>
                <h2 className="auth-slide-headline">
                  {slide.headline}
                </h2>
                <p className="auth-slide-sub">
                  {slide.sub}
                </p>
              </div>

              {/* Dot indicators */}
              <div className="auth-dots">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    className={`auth-dot ${
                      i === slideIndex ? 'active' : ''
                    }`}
                    onClick={() => goToSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <p className="auth-left-footer">
              Free to start · No credit card · Private by design
            </p>

          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="auth-right">
          <div className="auth-form-container">

            {/* Brand mark */}
            <div className="auth-form-mark">
              <span style={{ color: '#C96B2E' }}>☀</span>
            </div>

            {/* Heading */}
            <h1 className="auth-heading">
              {mode === 'login'
                ? 'Welcome back'
                : 'Create an account'}
            </h1>
            <p className="auth-subheading">
              {mode === 'login'
                ? 'Sol remembers you. Pick up where you left off.'
                : 'Free to start. No credit card needed.'}
            </p>

            {/* Error */}
            {error && (
              <div className="auth-error">{error}</div>
            )}

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">
                Your email
              </label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e =>
                    e.key === 'Enter' && handleSubmit()
                  }
                  placeholder="you@university.edu"
                  autoComplete="email"
                  style={{ paddingRight: 16 }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">
                {mode === 'login'
                  ? 'Password'
                  : 'Create password'}
              </label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e =>
                    e.key === 'Enter' && handleSubmit()
                  }
                  placeholder="••••••••"
                  autoComplete={
                    mode === 'login'
                      ? 'current-password'
                      : 'new-password'
                  }
                />
                <button
                  type="button"
                  className="auth-input-action"
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </div>
            </div>

            {/* Promo — register only */}
            {mode === 'register' && (
              <div className="auth-field">
                <label className="auth-label">
                  Promo code{' '}
                  <span>(optional)</span>
                </label>
                <div className="auth-input-wrap">
                  <input
                    className="auth-input"
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
                      letterSpacing: promoCode ? '0.06em' : 0,
                      fontWeight: promoCode ? 600 : 400,
                      borderColor:
                        promoValid === true ? '#3D7A5F'
                        : promoValid === false ? '#C0392B'
                        : undefined,
                    }}
                  />
                  {(checkingPromo ||
                    promoValid !== null) && (
                    <span
                      className="auth-input-status"
                      style={{
                        color:
                          promoValid === true ? '#3D7A5F'
                          : promoValid === false ? '#C0392B'
                          : '#C8C3BD',
                      }}
                    >
                      {checkingPromo ? '...'
                        : promoValid === true ? '✓'
                        : '✗'}
                    </span>
                  )}
                </div>
                {promoData && (
                  <div className="auth-promo-success">
                    🎉 {promoData.message}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              className="auth-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? 'Just a moment...'
                : mode === 'login'
                  ? 'Log in'
                  : 'Create account'}
            </button>

            {/* Mode switch */}
            <p className="auth-switch">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    className="auth-switch-btn"
                    onClick={() => switchMode('register')}
                  >
                    Create account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    className="auth-switch-btn"
                    onClick={() => switchMode('login')}
                  >
                    Log in
                  </button>
                </>
              )}
            </p>

            {/* Legal */}
            <p className="auth-legal">
              By continuing you agree to our{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>
              {' '}and{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
            </p>

          </div>
        </div>

      </div>
    </>
  )
}
