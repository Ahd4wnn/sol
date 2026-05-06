import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/axios'

export default function Upgrade() {
  const navigate = useNavigate()
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [error, setError] = useState(null)
  const [billingStatus, setBillingStatus] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('pro_6month')

  useEffect(() => {
    api.get('/api/billing/status')
      .then(r => setBillingStatus(r.data))
      .catch(() => {})
  }, [])

  const symbol = billingStatus?.currency_symbol || '$'
  const plans = billingStatus?.plans

  const handleUpgrade = async (planId) => {
    setUpgradeLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/api/billing/create-order', { plan: planId })

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'Sol',
        description: data.description,
        order_id: data.order_id,
        theme: { color: '#C96B2E' },
        handler: async (response) => {
          try {
            await api.post('/api/billing/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId
            })
            localStorage.removeItem('sol_upgrade_modal_last_shown')
            navigate('/dashboard', {
              state: { toast: 'Welcome to Sol Pro! 🎉' }
            })
          } catch {
            setError('Payment verified but activation failed. Contact support.')
          }
        },
        modal: { ondismiss: () => setUpgradeLoading(false) }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start checkout.')
      setUpgradeLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--mesh-home)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#C96B2E', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'white', fontFamily: 'Fraunces, serif',
          fontStyle: 'italic', fontSize: 24,
          margin: '0 auto 20px',
        }}>S</div>
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontSize: 36,
          fontWeight: 300, color: '#1A1714', marginBottom: 12,
        }}>You've found your place here.</h1>
        <p style={{ color: '#6B6560', fontSize: 16, maxWidth: 420, margin: '0 auto' }}>
          You've used your 10 free messages. Upgrade to keep going —
          Sol will remember everything you've shared.
        </p>
      </div>

      {/* 4 Plan cards */}
      {plans && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          maxWidth: 900,
          width: '100%',
          margin: '0 auto 40px',
        }}>
          {Object.values(plans).map(plan => {
            const isSelected = selectedPlan === plan.id
            const isBest = plan.badge === 'Best Value'

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  padding: '24px 20px',
                  borderRadius: 20,
                  border: `2px solid ${isSelected ? '#C96B2E' : 'rgba(232,227,221,0.7)'}`,
                  background: isSelected ? 'rgba(201,107,46,0.06)' : 'rgba(255,252,248,0.8)',
                  backdropFilter: 'blur(16px)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  position: 'relative',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 8px 32px rgba(201,107,46,0.15)' : 'none',
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 14px', borderRadius: 999,
                    background: isBest ? '#C96B2E' : '#3D7A5F',
                    color: 'white', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>{plan.badge}</div>
                )}

                {/* Label */}
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: isSelected ? '#C96B2E' : '#9E8E7E',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: 12,
                }}>{plan.label}</div>

                {/* Original price — crossed out */}
                <div style={{
                  fontSize: 14, color: '#C8C3BD',
                  textDecoration: 'line-through', marginBottom: 2,
                }}>{symbol}{plan.original_display}</div>

                {/* Discounted price */}
                <div style={{
                  display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: 18,
                    fontWeight: 300, color: '#1A1714',
                  }}>{symbol}</span>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: 38,
                    fontWeight: 300, lineHeight: 1,
                    color: isSelected ? '#C96B2E' : '#1A1714',
                    transition: 'color 200ms',
                  }}>{plan.amount_display}</span>
                </div>

                {/* Period */}
                <div style={{
                  fontSize: 13, color: '#9E8E7E',
                  marginBottom: plan.savings ? 10 : 0,
                }}>for {plan.period}</div>

                {/* Savings */}
                {plan.savings && (
                  <div style={{
                    display: 'inline-block',
                    padding: '3px 10px', borderRadius: 999,
                    background: 'rgba(61,122,95,0.1)',
                    border: '1px solid rgba(61,122,95,0.2)',
                    fontSize: 11, fontWeight: 600, color: '#3D7A5F',
                  }}>{plan.savings}</div>
                )}

                {/* Selected check */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#C96B2E', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 10, fontWeight: 700,
                  }}>✓</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        {plans?.[selectedPlan] && (
          <div style={{ marginBottom: 16, fontSize: 14, color: '#6B6560' }}>
            {symbol}{plans[selectedPlan].amount_display}
            {' '}for {plans[selectedPlan].period}
            {' · '}
            <span style={{ textDecoration: 'line-through', color: '#C8C3BD' }}>
              {symbol}{plans[selectedPlan].original_display}
            </span>
          </div>
        )}

        <button
          onClick={() => handleUpgrade(selectedPlan)}
          disabled={upgradeLoading || !selectedPlan}
          className="btn-mesh"
          style={{
            padding: '16px 48px', fontSize: 16, fontWeight: 600,
            opacity: upgradeLoading ? 0.7 : 1, minWidth: 240,
          }}
        >
          {upgradeLoading
            ? 'Processing...'
            : `Get ${plans?.[selectedPlan]?.label || 'Pro'} →`}
        </button>

        <p style={{ marginTop: 12, fontSize: 12, color: '#C8C3BD' }}>
          Secure payment via Razorpay · Cancel anytime
        </p>
      </div>

      {error && (
        <p style={{ color: '#C0392B', marginTop: 16, fontSize: 14 }}>{error}</p>
      )}

      <button
        onClick={() => navigate('/dashboard')}
        style={{
          marginTop: 24, background: 'none', border: 'none',
          color: '#9E8E7E', cursor: 'pointer', fontSize: 14,
          fontFamily: 'DM Sans, sans-serif',
        }}
      >← Back to dashboard</button>
    </div>
  )
}
