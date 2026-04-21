import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrainCircuit, Target, Moon } from 'lucide-react'

const CHAT_MESSAGES = [
  { role: 'user', text: "I've been feeling really overwhelmed with exams." },
  { role: 'assistant', text: "That sounds exhausting. What part of it is hitting you hardest right now?" },
  { role: 'user', text: "Honestly? I don't even know where to start." },
  { role: 'assistant', text: "That's okay. Sometimes not knowing where to start is exactly where we begin." },
]

const FEATURES = [
  {
    icon: <BrainCircuit size={20} strokeWidth={1.5} />,
    title: 'Sol remembers',
    body: 'Every session builds on the last. Sol tracks relationships, patterns, and growth — so you never have to explain yourself twice.',
  },
  {
    icon: <Target size={20} strokeWidth={1.5} />,
    title: 'Shaped around you',
    body: 'An 11-question psychological intake means Sol understands your attachment style, coping patterns, and what kind of support actually helps.',
  },
  {
    icon: <Moon size={20} strokeWidth={1.5} />,
    title: 'Always there',
    body: '3am spiral? Pre-exam anxiety? Post-breakup fog? Sol has no office hours. It\'s here whenever you need it.',
  },
]

const STEPS = [
  { num: '01', title: 'Answer 11 questions', body: 'Sol learns how you think, what stresses you, and what kind of support you actually need.' },
  { num: '02', title: 'Start a session', body: 'Talk about anything. Sol listens, remembers, and responds like someone who genuinely knows you.' },
  { num: '03', title: 'Grow over time', body: 'Watch your mood, memories, and patterns evolve. Sol builds a picture of you across every conversation.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [streamedText, setStreamedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isTypingIndicator, setIsTypingIndicator] = useState(false)

  // Animate chat messages one by one
  useEffect(() => {
    if (visibleMessages >= CHAT_MESSAGES.length) return

    const msg = CHAT_MESSAGES[visibleMessages]

    if (msg.role === 'user') {
      const timer = setTimeout(() => {
        setVisibleMessages(v => v + 1)
      }, visibleMessages === 0 ? 1200 : 800)
      return () => clearTimeout(timer)
    }

    // Assistant message — stream it in
    if (msg.role === 'assistant') {
      setIsTypingIndicator(true)

      const delayTimer = setTimeout(() => {
        setIsTypingIndicator(false)
        setIsStreaming(true)
        setStreamedText('')
        let i = 0
        const interval = setInterval(() => {
          i++
          setStreamedText(msg.text.slice(0, i))
          if (i >= msg.text.length) {
            clearInterval(interval)
            setTimeout(() => {
              setIsStreaming(false)
              setVisibleMessages(v => v + 1)
            }, 900)
          }
        }, 28)
      }, 1000)

      return () => clearTimeout(delayTimer)
    }
  }, [visibleMessages])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--mesh-home)',
      fontFamily: 'DM Sans, sans-serif',
      overflowX: 'hidden',
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 48px',
        background: 'rgba(249,247,244,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(232,227,221,0.6)',
      }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#C96B2E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 14,
          }}>S</div>
          <span style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 22,
            fontWeight: 300,
            color: '#1A1714',
          }}>Sol</span>
        </div>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/auth')}
            className="landing-nav-signin"
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              color: '#6B6560',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: 999,
              transition: 'color 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#1A1714'}
            onMouseLeave={e => e.currentTarget.style.color = '#6B6560'}
          >Sign in</button>
          <button
            onClick={() => navigate('/auth')}
            className="btn-mesh"
            style={{ padding: '10px 22px', fontSize: 14 }}
          >Get started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '80px 48px 60px',
        display: 'flex',
        alignItems: 'center',
        gap: 60,
        flexWrap: 'wrap',
      }}>
        {/* Left — copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ flex: '1 1 380px', minWidth: 0 }}
        >
          {/* Pre-headline chip */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(201,107,46,0.08)',
            border: '1px solid rgba(201,107,46,0.2)',
            marginBottom: 24,
          }}>
            <span style={{ color: '#C96B2E', fontSize: 12 }}>✦</span>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              color: '#C96B2E',
            }}>Built for college students</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(40px, 6vw, 68px)',
            fontWeight: 300,
            color: '#1A1714',
            lineHeight: 1.08,
            margin: '0 0 20px',
            letterSpacing: '-0.02em',
          }}>
            Therapy that<br />
            <span style={{ color: '#C96B2E', fontStyle: 'italic' }}>
              actually gets
            </span>
            <br />you.
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: 18,
            color: '#6B6560',
            lineHeight: 1.65,
            maxWidth: 420,
            margin: '0 0 36px',
          }}>
            Sol is an AI therapist that remembers everything,
            adapts to you completely, and shows up whenever you
            need it. Like a brilliant friend who actually listens.
          </p>

          {/* CTA row */}
          <div style={{ display: 'flex', alignItems: 'center',
                       gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/auth')}
              className="btn-mesh"
              style={{ padding: '15px 32px', fontSize: 16 }}
            >
              Start for free →
            </button>
            <span style={{ fontSize: 13, color: '#9E8E7E' }}>
              No credit card needed
            </span>
          </div>

          {/* Trust pills */}
          <div style={{
            display: 'flex',
            gap: 20,
            marginTop: 32,
            flexWrap: 'wrap',
          }}>
            {[
              '✦ No judgment',
              '✦ Available 24/7',
              '✦ Remembers everything',
            ].map(pill => (
              <span key={pill} style={{
                fontSize: 13,
                color: '#9E8E7E',
                letterSpacing: '0.01em',
              }}>{pill}</span>
            ))}
          </div>
        </motion.div>

        {/* Right — animated chat mockup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            flex: '1 1 320px',
            minWidth: 0,
            maxWidth: 380,
            animation: 'float 4s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
          `}</style>

          {/* Phone frame */}
          <div style={{
            background: 'rgba(255,252,248,0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.85)',
            borderRadius: 28,
            boxShadow: '0 24px 64px rgba(201,107,46,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            {/* Chat header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(232,227,221,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(249,247,244,0.8)',
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#C96B2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontFamily: 'Fraunces, serif',
                fontStyle: 'italic',
                fontSize: 14,
                flexShrink: 0,
              }}>S</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500,
                             color: '#1A1714' }}>Sol</div>
                <div style={{ fontSize: 11, color: '#3D7A5F',
                             display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%',
                                background: '#3D7A5F',
                                display: 'inline-block' }} />
                  Online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              padding: '20px 16px',
              minHeight: 260,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {CHAT_MESSAGES.slice(0, visibleMessages).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user'
                      ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user'
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? '#C96B2E'
                      : 'rgba(255,252,248,0.9)',
                    border: msg.role === 'assistant'
                      ? '1px solid rgba(232,227,221,0.8)' : 'none',
                    color: msg.role === 'user' ? 'white' : '#1A1714',
                    fontSize: 13,
                    lineHeight: 1.55,
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Streaming assistant message */}
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: 'flex-start' }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'rgba(255,252,248,0.9)',
                    border: '1px solid rgba(232,227,221,0.8)',
                    color: '#1A1714',
                    fontSize: 13,
                    lineHeight: 1.55,
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {streamedText}
                    <span style={{
                      display: 'inline-block',
                      width: 2,
                      height: 13,
                      background: '#C96B2E',
                      marginLeft: 2,
                      verticalAlign: 'middle',
                      animation: 'blink 0.8s step-end infinite',
                    }} />
                    <style>{`
                      @keyframes blink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0; }
                      }
                    `}</style>
                  </div>
                </motion.div>
              )}

              {/* Typing indicator */}
              {isTypingIndicator && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'rgba(255,252,248,0.9)',
                    border: '1px solid rgba(232,227,221,0.8)',
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#C96B2E',
                        display: 'inline-block',
                        animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                        opacity: 0.4,
                      }} />
                    ))}
                    <style>{`
                      @keyframes typingDot {
                        0%, 100% { opacity: 0.4; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.3); }
                      }
                    `}</style>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '60px 48px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              style={{
                padding: '28px 24px',
                borderRadius: 22,
                background: 'rgba(255,252,248,0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(232,227,221,0.7)',
                boxShadow: '0 4px 24px rgba(201,107,46,0.06)',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(201,107,46,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#C96B2E',
                marginBottom: 16,
              }}>{f.icon}</div>
              <h3 style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 20,
                fontWeight: 300,
                color: '#1A1714',
                margin: '0 0 10px',
              }}>{f.title}</h3>
              <p style={{
                fontSize: 14,
                color: '#6B6560',
                lineHeight: 1.65,
                margin: 0,
              }}>{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '60px 48px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 300,
            color: '#1A1714',
            margin: '0 0 12px',
          }}>How Sol works</h2>
          <p style={{ color: '#9E8E7E', fontSize: 16 }}>
            Three steps to a therapist that actually knows you.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              style={{
                padding: '28px 24px',
                borderRadius: 22,
                background: 'rgba(255,252,248,0.5)',
                border: '1px solid rgba(232,227,221,0.5)',
                position: 'relative',
              }}
            >
              <div style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 42,
                fontWeight: 300,
                color: 'rgba(201,107,46,0.15)',
                lineHeight: 1,
                marginBottom: 12,
              }}>{step.num}</div>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#1A1714',
                margin: '0 0 8px',
              }}>{step.title}</h3>
              <p style={{
                fontSize: 14,
                color: '#6B6560',
                lineHeight: 1.65,
                margin: 0,
              }}>{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '60px 48px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 300,
            color: '#1A1714',
            margin: '0 0 12px',
          }}>Simple pricing</h2>
          <p style={{ color: '#9E8E7E', fontSize: 16 }}>
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Free */}
          <div style={{
            flex: '1 1 260px',
            maxWidth: 300,
            padding: '32px 28px',
            borderRadius: 24,
            background: 'rgba(255,252,248,0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(232,227,221,0.7)',
          }}>
            <div style={{ fontSize: 13, color: '#9E8E7E', fontWeight: 600,
                         textTransform: 'uppercase', letterSpacing: '0.06em',
                         marginBottom: 12 }}>Free</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4,
                         marginBottom: 24 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 44,
                            fontWeight: 300, color: '#1A1714' }}>$0</span>
            </div>
            {[
              '20 messages to try Sol',
              'Full onboarding + profiling',
              'Memory across sessions',
              'All therapist characters',
            ].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8,
                                   marginBottom: 10, fontSize: 14,
                                   color: '#6B6560', alignItems: 'flex-start' }}>
                <span style={{ color: '#C96B2E', flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
            <button
              onClick={() => navigate('/auth')}
              style={{
                width: '100%',
                marginTop: 24,
                padding: '13px',
                borderRadius: 999,
                border: '1.5px solid #C96B2E',
                background: 'transparent',
                color: '#C96B2E',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#C96B2E'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#C96B2E'
              }}
            >Get started free</button>
          </div>

          {/* Pro */}
          <div style={{
            flex: '1 1 260px',
            maxWidth: 300,
            padding: '32px 28px',
            borderRadius: 24,
            background: 'rgba(201,107,46,0.05)',
            backdropFilter: 'blur(16px)',
            border: '2px solid #C96B2E',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: -13,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#C96B2E',
              color: 'white',
              padding: '4px 18px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}>MOST POPULAR</div>

            <div style={{ fontSize: 13, color: '#C96B2E', fontWeight: 600,
                         textTransform: 'uppercase', letterSpacing: '0.06em',
                         marginBottom: 12 }}>Pro</div>

            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 44,
                              fontWeight: 300, color: '#1A1714' }}>$9</span>
                <span style={{ color: '#9E8E7E', fontSize: 15 }}>/month</span>
              </div>
              <div style={{ fontSize: 13, color: '#3D7A5F', fontWeight: 500,
                           marginBottom: 20 }}>
                or $89/year · save 17%
              </div>
            </div>

            {[
              'Unlimited sessions',
              'Full memory & relationships',
              'All 4 therapist characters',
              'Priority support',
              'Early access to new features',
            ].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8,
                                   marginBottom: 10, fontSize: 14,
                                   color: '#6B6560', alignItems: 'flex-start' }}>
                <span style={{ color: '#C96B2E', flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}

            <button
              onClick={() => navigate('/auth')}
              className="btn-mesh"
              style={{ width: '100%', marginTop: 24,
                      padding: '13px', fontSize: 14 }}
            >
              Start free → Upgrade anytime
            </button>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '60px 48px 80px',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            padding: '64px 48px',
            borderRadius: 32,
            background: 'rgba(255,252,248,0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(232,227,221,0.7)',
            boxShadow: '0 8px 40px rgba(201,107,46,0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute',
            top: -80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(201,107,46,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#C96B2E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: 26,
            margin: '0 auto 24px',
            boxShadow: '0 4px 20px rgba(201,107,46,0.4)',
            position: 'relative',
          }}>S</div>

          <h2 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 300,
            color: '#1A1714',
            margin: '0 0 16px',
            position: 'relative',
          }}>
            Your mind deserves a friend.
          </h2>

          <p style={{
            fontSize: 17,
            color: '#6B6560',
            maxWidth: 440,
            margin: '0 auto 36px',
            lineHeight: 1.65,
            position: 'relative',
          }}>
            Start for free. No credit card.
            No waitlist. Sol is ready when you are.
          </p>

          <button
            onClick={() => navigate('/auth')}
            className="btn-mesh"
            style={{
              padding: '16px 40px',
              fontSize: 17,
              position: 'relative',
            }}
          >
            Talk to Sol — it's free →
          </button>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(232,227,221,0.6)',
        padding: '48px 48px 32px',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        {/* Acknowledgment */}
        <div style={{ marginBottom: 48 }}>
          <h4 style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: '#1A1714', 
            letterSpacing: '0.08em', 
            textTransform: 'uppercase',
            marginBottom: 12,
            fontFamily: 'DM Sans, sans-serif'
          }}>Acknowledgment</h4>
          <p style={{ 
            fontSize: 14, 
            color: '#6B6560', 
            lineHeight: 1.6, 
            margin: 0,
            maxWidth: 800
          }}>
            Sol is not designed to be used in crisis. If you are in crisis, please seek out professional help, 
            or a crisis line. You can find resources at <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#C96B2E', textDecoration: 'underline' }}>www.findahelpline.com</a>.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          borderTop: '1px solid rgba(232,227,221,0.4)',
          paddingTop: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#C96B2E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 11,
            }}>S</div>
            <span style={{
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 16,
              color: '#6B6560',
            }}>Sol</span>
            <span style={{ color: '#C8C3BD', fontSize: 13, marginLeft: 8 }}>
              Made with care for students everywhere.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <a
                key={link}
                href={
                  link === 'Privacy' ? '/privacy' :
                  link === 'Terms' ? '/terms' :
                  'mailto:hello@talktosol.online'
                }
                style={{
                  fontSize: 13,
                  color: '#9E8E7E',
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#C96B2E'}
                onMouseLeave={e => e.currentTarget.style.color = '#9E8E7E'}
              >{link}</a>
            ))}
            <a
              href="mailto:hello@talktosol.online"
              style={{
                fontSize: 13,
                color: '#C8C3BD',
                textDecoration: 'none',
              }}
            >hello@talktosol.online</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
