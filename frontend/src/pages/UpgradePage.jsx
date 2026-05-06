import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { api } from '../lib/axios'

export default function UpgradePage() {
  const navigate = useNavigate()
  const [billingStatus, setBillingStatus] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('pro_6month')
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/billing/status').then(r => setBillingStatus(r.data))
  }, [])

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
            setBillingStatus(prev => ({ ...prev, is_pro: true, plan: planId }))
            localStorage.removeItem('sol_upgrade_modal_last_shown')
          } catch {
            setError('Payment done but activation failed. Contact support.')
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

  const isPro = billingStatus?.is_pro === true
  const sym = billingStatus?.currency_symbol || '$'
  const plans = billingStatus?.plans

  // Map plan ID to a friendly label for active status
  const planLabel = billingStatus?.plan
    ? (plans?.[billingStatus.plan]?.label || billingStatus.plan.replace('pro_', '').replace('month', ' Month'))
    : 'Pro'

  return (
    <AppShell>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: 'DM Sans, sans-serif',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <h1 className="page-title" style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 40, fontWeight: 300,
            color: '#1A1714', marginBottom: 12,
          }}>
            {isPro ? 'You\'re on Sol Pro ✦' : 'Upgrade to Sol Pro'}
          </h1>
          <p style={{
            fontSize: 17, color: '#6B6560', maxWidth: 440,
            margin: '0 auto', lineHeight: 1.6,
          }}>
            {isPro
              ? 'Thank you for supporting Sol. You have unlimited access to everything.'
              : 'You\'ve used your free messages. Keep going — Sol remembers everything you\'ve shared.'}
          </p>
        </div>

        {/* Current status card (Pro users) */}
        {isPro && (
          <div style={{
            padding: '24px', borderRadius: 20,
            background: 'rgba(61,122,95,0.06)',
            border: '1px solid rgba(61,122,95,0.2)',
            marginBottom: 32,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#3D7A5F', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 20, flexShrink: 0,
            }}>✓</div>
            <div>
              <div style={{ fontWeight: 600, color: '#3D7A5F', fontSize: 15 }}>
                Active — {planLabel} Plan
              </div>
              {billingStatus?.period_end && (
                <div style={{ fontSize: 13, color: '#6B6560', marginTop: 2 }}>
                  Renews {new Date(billingStatus.period_end).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plan cards (free users only) */}
        {!isPro && plans && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              marginBottom: 32,
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
                      background: isSelected ? 'rgba(201,107,46,0.06)' : 'rgba(255,252,248,0.9)',
                      backdropFilter: 'blur(12px)',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      position: 'relative',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected ? '0 8px 32px rgba(201,107,46,0.15)' : 'none',
                    }}
                  >
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

                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: isSelected ? '#C96B2E' : '#9E8E7E',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      marginBottom: 12,
                    }}>{plan.label}</div>

                    <div style={{
                      fontSize: 14, color: '#C8C3BD',
                      textDecoration: 'line-through', marginBottom: 2,
                    }}>{sym}{plan.original_display}</div>

                    <div style={{
                      display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4,
                    }}>
                      <span style={{
                        fontFamily: 'Fraunces, serif', fontSize: 18,
                        fontWeight: 300, color: '#1A1714',
                      }}>{sym}</span>
                      <span style={{
                        fontFamily: 'Fraunces, serif', fontSize: 38,
                        fontWeight: 300, lineHeight: 1,
                        color: isSelected ? '#C96B2E' : '#1A1714',
                        transition: 'color 200ms',
                      }}>{plan.amount_display}</span>
                    </div>

                    <div style={{
                      fontSize: 13, color: '#9E8E7E',
                      marginBottom: plan.savings ? 10 : 0,
                    }}>for {plan.period}</div>

                    {plan.savings && (
                      <div style={{
                        display: 'inline-block',
                        padding: '3px 10px', borderRadius: 999,
                        background: 'rgba(61,122,95,0.1)',
                        border: '1px solid rgba(61,122,95,0.2)',
                        fontSize: 11, fontWeight: 600, color: '#3D7A5F',
                      }}>{plan.savings}</div>
                    )}

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

            {/* CTA */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              {plans[selectedPlan] && (
                <div style={{ marginBottom: 16, fontSize: 14, color: '#6B6560' }}>
                  {sym}{plans[selectedPlan].amount_display}
                  {' '}for {plans[selectedPlan].period}
                  {' · '}
                  <span style={{ textDecoration: 'line-through', color: '#C8C3BD' }}>
                    {sym}{plans[selectedPlan].original_display}
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
                  : `Get ${plans[selectedPlan]?.label || 'Pro'} →`}
              </button>

              <p style={{ marginTop: 12, fontSize: 12, color: '#C8C3BD' }}>
                Secure payment via Razorpay · Cancel anytime · Your conversations are always private
              </p>
            </div>

            {error && (
              <p style={{ color: '#C0392B', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
                {error}
              </p>
            )}
          </>
        )}

        {/* Cancel subscription link for pro users */}
        {isPro && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              onClick={async () => {
                if (!window.confirm('Cancel your Pro subscription?')) return
                await api.post('/api/billing/cancel')
                setBillingStatus(prev => ({ ...prev, is_pro: false }))
              }}
              style={{
                background: 'none', border: 'none',
                color: '#9E8E7E', fontSize: 13, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'underline',
              }}
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
