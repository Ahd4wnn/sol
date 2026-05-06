import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../lib/axios'

const STORAGE_KEY = 'sol_upgrade_modal_last_shown'
const INTERVAL_MS = 5 * 60 * 60 * 1000  // 5 hours in milliseconds

export function UpgradeModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [pricing, setPricing] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('pro_6month')

  useEffect(() => {
    if (!isOpen) return
    api.get('/api/billing/pricing')
      .then(r => setPricing(r.data))
      .catch(() => {})
  }, [isOpen])

  const symbol = pricing?.currency_symbol || '$'
  const plans = pricing?.plans

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(26,23,20,0.4)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              background: 'rgba(255,252,248,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 24px 64px rgba(201,107,46,0.18), 0 4px 16px rgba(0,0,0,0.08)',
              padding: '40px 36px 32px',
              textAlign: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Ambient glow */}
            <div style={{
              position: 'absolute', top: -60, left: '50%',
              transform: 'translateX(-50%)',
              width: 300, height: 300, borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(201,107,46,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 32, height: 32, borderRadius: '50%',
                background: '#F0EBE5', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: '#9E8E7E',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E8E3DD'}
              onMouseLeave={e => e.currentTarget.style.background = '#F0EBE5'}
            >×</button>

            {/* Sol avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--mesh-button)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontFamily: 'Fraunces, serif',
              fontStyle: 'italic', fontSize: 26,
              margin: '0 auto 20px',
              boxShadow: '0 4px 20px rgba(201,107,46,0.35)',
            }}>S</div>

            {/* Headline */}
            <h2 style={{
              fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 300,
              color: '#1A1714', margin: '0 0 10px', lineHeight: 1.2,
            }}>Sol remembers you.</h2>

            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 15,
              color: '#6B6560', margin: '0 0 24px', lineHeight: 1.6,
            }}>
              You've started something here. Upgrade to keep every
              conversation, memory, and insight — with no limits.
            </p>

            {/* Plan cards — horizontal scroll */}
            <div style={{
              display: 'flex', gap: 10,
              overflowX: 'auto', paddingBottom: 8,
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              margin: '0 -4px',
              padding: '4px 4px 12px',
              marginBottom: 20,
            }}>
              {plans && Object.values(plans).map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    minWidth: 115, padding: '14px 12px',
                    borderRadius: 14,
                    border: `2px solid ${selectedPlan === plan.id ? '#C96B2E' : '#E8E3DD'}`,
                    background: selectedPlan === plan.id ? 'rgba(201,107,46,0.06)' : 'white',
                    cursor: 'pointer', flexShrink: 0,
                    position: 'relative',
                    transition: 'all 150ms',
                    textAlign: 'center',
                  }}
                >
                  {plan.badge && (
                    <div style={{
                      position: 'absolute', top: -10, left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '2px 8px', borderRadius: 999,
                      background: plan.badge === 'Best Value' ? '#C96B2E' : '#3D7A5F',
                      color: 'white', fontSize: 9, fontWeight: 700,
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                      letterSpacing: '0.04em',
                    }}>{plan.badge}</div>
                  )}

                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    color: '#9E8E7E', textTransform: 'uppercase',
                    letterSpacing: '0.05em', marginBottom: 6,
                  }}>{plan.label}</div>

                  <div style={{
                    fontSize: 11, color: '#C8C3BD',
                    textDecoration: 'line-through', marginBottom: 1,
                  }}>{symbol}{plan.original_display}</div>

                  <div style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: 22, fontWeight: 300,
                    color: selectedPlan === plan.id ? '#C96B2E' : '#1A1714',
                  }}>{symbol}{plan.amount_display}</div>

                  {plan.savings && (
                    <div style={{
                      fontSize: 9, color: '#3D7A5F',
                      fontWeight: 600, marginTop: 4,
                    }}>{plan.savings}</div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              className="btn-mesh"
              onClick={() => { onClose(); navigate('/upgrade') }}
              style={{ width: '100%', padding: '14px', fontSize: 15 }}
            >
              See Pro Plans →
            </button>

            {/* Dismiss */}
            <button
              onClick={onClose}
              style={{
                marginTop: 14, background: 'none', border: 'none',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13, color: '#9E8E7E', cursor: 'pointer',
                display: 'block', width: '100%',
              }}
            >Maybe later</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Hook to manage modal timing
export function useUpgradeModal(isPro) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Never show to pro users
    if (isPro) return

    const lastShown = localStorage.getItem(STORAGE_KEY)
    const now = Date.now()

    if (!lastShown || now - parseInt(lastShown) > INTERVAL_MS) {
      // Delay 2 seconds after dashboard load
      const timer = setTimeout(() => {
        setIsOpen(true)
        localStorage.setItem(STORAGE_KEY, now.toString())
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isPro])

  const close = () => setIsOpen(false)

  return { isOpen, close }
}
