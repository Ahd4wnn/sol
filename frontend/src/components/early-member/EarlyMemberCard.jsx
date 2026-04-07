import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export function EarlyMemberCard({ profile }) {
  const [open, setOpen] = useState(false)

  const memberNumber = String(profile?.early_member_number || 1).padStart(3, '0')
  const memberName = profile?.preferred_name || profile?.full_name || 'Member'

  // Auto-reveal first time
  useEffect(() => {
    const key = `sol_card_revealed_${profile?.id}`
    if (!localStorage.getItem(key)) {
      setTimeout(() => {
        setOpen(true)
        localStorage.setItem(key, '1')
      }, 1000)
    }
  }, [profile?.id])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── SIDEBAR TRIGGER ── */}
      <div
        onClick={() => setOpen(true)}
        style={{
          margin: '8px 12px 16px',
          padding: '14px 16px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #E8874A 0%, #C96B2E 100%)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          boxShadow: '0 4px 16px rgba(201,107,46,0.3)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,107,46,0.45)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,107,46,0.3)'
        }}
      >
        {/* Shimmer sweep */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerSweep 2.5s ease-in-out infinite',
          pointerEvents: 'none',
          borderRadius: 14,
        }} />

        {/* Watermark */}
        <div style={{
          position: 'absolute',
          bottom: -12,
          right: -8,
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 64,
          color: 'rgba(255,255,255,0.1)',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}>Sol</div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 15,
            color: 'rgba(255,255,255,0.95)',
            marginBottom: 6,
            lineHeight: 1.2,
          }}>Sol Early<br />Accelerator</div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10 }}>✦</span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Early Member</span>
            </div>

            <div style={{
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'rgba(255,255,255,0.8)',
            }}>#{memberNumber}</div>
          </div>
        </div>

        <style>{`
          @keyframes shimmerSweep {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>

      {/* ── FULL CARD MODAL — rendered at body level via portal ── */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}>

              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(10, 8, 6, 0.75)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              />

              {/* Ambient glow behind card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'fixed',
                  width: 600,
                  height: 600,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(232,135,74,0.35) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />

              {/* Card container with 3D perspective */}
              <div style={{
                perspective: '1200px',
                position: 'relative',
                zIndex: 2,
                width: '100%',
                maxWidth: 500,
              }}>
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.6,
                    rotateX: 25,
                    rotateY: -20,
                    y: 60,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotateX: 0,
                    rotateY: 0,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    rotateX: -10,
                    y: 40,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    width: '100%',
                    aspectRatio: '1.586',
                    borderRadius: 28,
                    background: 'linear-gradient(135deg, #F5B060 0%, #E8874A 30%, #D4732A 65%, #C05A1E 100%)',
                    boxShadow: `
                      0 60px 120px rgba(201,107,46,0.6),
                      0 20px 40px rgba(0,0,0,0.3),
                      0 0 0 1px rgba(255,255,255,0.15) inset,
                      0 1px 0 rgba(255,255,255,0.3) inset
                    `,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                  }}
                  onClick={() => setOpen(false)}

                  // Tilt on mouse move
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = (e.clientX - rect.left) / rect.width - 0.5
                    const y = (e.clientY - rect.top) / rect.height - 0.5
                    e.currentTarget.style.transform =
                      `rotateY(${x * 12}deg) rotateX(${-y * 8}deg) scale(1.02)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      'rotateY(0deg) rotateX(0deg) scale(1)'
                    e.currentTarget.style.transition = 'transform 400ms ease'
                  }}
                >
                  {/* ── CARD SURFACE EFFECTS ── */}

                  {/* Mesh radial overlays */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `
                      radial-gradient(ellipse at 20% 25%, rgba(255,255,255,0.18) 0%, transparent 55%),
                      radial-gradient(ellipse at 85% 80%, rgba(0,0,0,0.12) 0%, transparent 50%)
                    `,
                  }} />

                  {/* Foil shimmer moving overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.12) 50%, transparent 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'cardFoil 3s ease-in-out infinite',
                    borderRadius: 28,
                  }} />

                  {/* Large watermark "Sol" */}
                  <div style={{
                    position: 'absolute',
                    bottom: -40,
                    right: -30,
                    fontFamily: 'Fraunces, serif',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: 220,
                    color: 'rgba(255,255,255,0.07)',
                    lineHeight: 1,
                    userSelect: 'none',
                    pointerEvents: 'none',
                    letterSpacing: '-0.04em',
                  }}>Sol</div>

                  {/* Subtle dot pattern */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }} />

                  {/* ── CARD CONTENT ── */}
                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: 'clamp(20px, 6%, 32px)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}>

                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start',
                                 justifyContent: 'space-between' }}>
                      <div style={{
                        fontFamily: 'Fraunces, serif',
                        fontStyle: 'italic',
                        fontWeight: 300,
                        fontSize: 'clamp(18px, 4%, 24px)',
                        color: 'rgba(255,255,255,0.95)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.01em',
                      }}>Sol Early Accelerator</div>

                      {/* Small Sol icon top right */}
                      <div style={{
                        width: 32, height: 32,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Fraunces, serif',
                        fontStyle: 'italic',
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.9)',
                        flexShrink: 0,
                      }}>S</div>
                    </div>

                    {/* Bottom row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}>
                      {/* Left — feature pill */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '8px 16px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>✦</span>
                        <span style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.9)',
                          whiteSpace: 'nowrap',
                        }}>Enjoy Exclusive Features</span>
                      </div>

                      {/* Right — name + number */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontFamily: 'Fraunces, serif',
                          fontStyle: 'italic',
                          fontWeight: 300,
                          fontSize: 'clamp(13px, 3%, 17px)',
                          color: 'rgba(255,255,255,0.8)',
                          marginBottom: 3,
                        }}>{memberName}</div>
                        <div style={{
                          fontFamily: 'Fraunces, serif',
                          fontStyle: 'italic',
                          fontWeight: 300,
                          fontSize: 'clamp(22px, 5.5%, 32px)',
                          color: 'rgba(255,255,255,0.97)',
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                        }}>#{memberNumber} of 100</div>
                      </div>
                    </div>
                  </div>

                  <style>{`
                    @keyframes cardFoil {
                      0% { background-position: 200% 0; }
                      100% { background-position: -200% 0; }
                    }
                  `}</style>
                </motion.div>

                {/* Tap to dismiss hint */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  style={{
                    textAlign: 'center',
                    marginTop: 20,
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.45)',
                    letterSpacing: '0.02em',
                  }}
                >tap anywhere to close</motion.div>
              </div>

              {/* Particle sparks */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0,
                    x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos(i * 45 * Math.PI / 180) * (80 + Math.random() * 60),
                    y: Math.sin(i * 45 * Math.PI / 180) * (80 + Math.random() * 60),
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + i * 0.04,
                    ease: 'easeOut',
                  }}
                  style={{
                    position: 'fixed',
                    width: i % 3 === 0 ? 6 : 4,
                    height: i % 3 === 0 ? 6 : 4,
                    borderRadius: '50%',
                    background: i % 2 === 0 ? '#E8874A' : '#F5B060',
                    zIndex: 3,
                    pointerEvents: 'none',
                    left: '50%',
                    top: '50%',
                  }}
                />
              ))}

            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
