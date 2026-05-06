import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../lib/axios'

const STORAGE_KEY = 'sol_upgrade_modal_last_shown'
const INTERVAL_MS = 5 * 60 * 60 * 1000  // 5 hours in milliseconds

export function UpgradeModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [pricing, setPricing] = useState({ sym: '$', monthly: '10', yearly: '89', savings: 'Save $31' })

  useEffect(() => {
    if (!isOpen) return
    api.get('/api/billing/pricing')
      .then(r => {
        const p = r.data
        setPricing({
          sym: p.currency_symbol,
          monthly: p.plans.pro_monthly.amount_display,
          yearly: p.plans.pro_yearly.amount_display,
          savings: p.plans.pro_yearly.savings || 'Best value',
        })
      })
      .catch(() => {})
  }, [isOpen])
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
              maxWidth: 420,
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
            {/* Ambient glow behind content */}
            <div style={{
              position: 'absolute',
              top: -60,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(201,107,46,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#F0EBE5',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: '#9E8E7E',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E8E3DD'}
              onMouseLeave={e => e.currentTarget.style.background = '#F0EBE5'}
            >×</button>

            {/* Sol avatar */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--mesh-button)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 26,
              margin: '0 auto 20px',
              boxShadow: '0 4px 20px rgba(201,107,46,0.35)',
            }}>S</div>

            {/* Headline */}
            <h2 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 26,
              fontWeight: 300,
              color: '#1A1714',
              margin: '0 0 10px',
              lineHeight: 1.2,
            }}>
              Sol remembers you.
            </h2>

            {/* Subtext */}
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              color: '#6B6560',
              margin: '0 0 28px',
              lineHeight: 1.6,
            }}>
              You've started something here. Upgrade to keep every
              conversation, memory, and insight — with no limits.
            </p>

            {/* Plan pills */}
            <div style={{
              display: 'flex',
              gap: 10,
              marginBottom: 24,
              justifyContent: 'center',
            }}>
              {[
                { label: 'Monthly', price: `${pricing.sym}${pricing.monthly}/mo` },
                { label: 'Yearly', price: `${pricing.sym}${pricing.yearly}/yr`, tag: pricing.savings },
              ].map(plan => (
                <div key={plan.label} style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid #E8E3DD',
                  background: 'rgba(255,252,248,0.8)',
                  textAlign: 'center',
                }}>
                  {plan.tag && (
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#3D7A5F',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 4,
                    }}>{plan.tag}</div>
                  )}
                  <div style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: 20,
                    fontWeight: 300,
                    color: '#1A1714',
                  }}>{plan.price}</div>
                  <div style={{
                    fontSize: 12,
                    color: '#9E8E7E',
                    marginTop: 2,
                  }}>{plan.label}</div>
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

            {/* Dismiss link */}
            <button
              onClick={onClose}
              style={{
                marginTop: 14,
                background: 'none',
                border: 'none',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: '#9E8E7E',
                cursor: 'pointer',
                display: 'block',
                width: '100%',
              }}
            >
              Maybe later
            </button>
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
      // Delay 2 seconds after dashboard load — not instant, feels less pushy
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
