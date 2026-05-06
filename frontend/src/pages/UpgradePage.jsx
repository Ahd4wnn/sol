import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { api } from '../lib/axios'

export default function UpgradePage() {
  const navigate = useNavigate()
  const [billingStatus, setBillingStatus] = useState(null)
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/billing/status').then(r => setBillingStatus(r.data))
  }, [])

  const handleUpgrade = async (planId) => {
    setLoading(planId)
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
        prefill: { email: data.user_email },
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
            // Clear modal timer so it never shows again
            localStorage.removeItem('sol_upgrade_modal_last_shown')
          } catch {
            setError('Payment done but activation failed. Contact support.')
          }
        },
        modal: { ondismiss: () => setLoading(null) }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start checkout.')
      setLoading(null)
    }
  }

  const isPro = billingStatus?.is_pro === true
  const sym = billingStatus?.currency_symbol || '$'
  const plans = billingStatus?.plans || {}

  return (
    <AppShell>
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: 'DM Sans, sans-serif',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <h1 className="page-title" style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 40,
            fontWeight: 300,
            color: '#1A1714',
            marginBottom: 12,
          }}>
            {isPro ? 'You\'re on Sol Pro ✦' : 'Upgrade to Sol Pro'}
          </h1>
          <p style={{ fontSize: 17, color: '#6B6560', maxWidth: 440,
                     margin: '0 auto', lineHeight: 1.6 }}>
            {isPro
              ? 'Thank you for supporting Sol. You have unlimited access to everything.'
              : 'You\'ve used your free messages. Keep going — Sol remembers everything you\'ve shared.'}
          </p>
        </div>

        {/* Current status card (Pro users) */}
        {isPro && (
          <div style={{
            padding: '24px',
            borderRadius: 20,
            background: 'rgba(61,122,95,0.06)',
            border: '1px solid rgba(61,122,95,0.2)',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#3D7A5F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 20,
              flexShrink: 0,
            }}>✓</div>
            <div>
              <div style={{ fontWeight: 600, color: '#3D7A5F', fontSize: 15 }}>
                Active — {billingStatus?.plan === 'pro_yearly' ? 'Yearly' : 'Monthly'} Plan
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
        {!isPro && (
          <>
            <div className="upgrade-plans-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}>
              {/* Monthly */}
              <div style={{
                padding: '28px 24px',
                borderRadius: 22,
                border: '1.5px solid #E8E3DD',
                background: 'rgba(255,252,248,0.9)',
                backdropFilter: 'blur(12px)',
              }}>
                <div style={{ fontSize: 13, color: '#9E8E7E', fontWeight: 600,
                             textTransform: 'uppercase', letterSpacing: '0.06em',
                             marginBottom: 12 }}>Monthly</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4,
                             marginBottom: 20 }}>
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: 44,
                                fontWeight: 300, color: '#1A1714' }}>
                    <span style={{ fontSize: 22 }}>{sym}</span>
                    {plans.pro_monthly?.amount_display || '10'}
                  </span>
                  <span style={{ color: '#9E8E7E', fontSize: 15 }}>/month</span>
                </div>
                {[
                  'Unlimited sessions',
                  'Full memory across sessions',
                  'All 4 therapist characters',
                  'Feedback & insights',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, marginBottom: 8,
                                       fontSize: 14, color: '#6B6560',
                                       alignItems: 'flex-start' }}>
                    <span style={{ color: '#C96B2E', flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
                <button
                  className="btn-mesh"
                  onClick={() => handleUpgrade('pro_monthly')}
                  disabled={!!loading}
                  style={{ width: '100%', padding: '13px', fontSize: 14,
                          marginTop: 20,
                          opacity: loading && loading !== 'pro_monthly' ? 0.5 : 1 }}
                >
                  {loading === 'pro_monthly' ? 'Opening...' : 'Get Monthly'}
                </button>
              </div>

              {/* Yearly */}
              <div style={{
                padding: '28px 24px',
                borderRadius: 22,
                border: '2px solid #C96B2E',
                background: 'rgba(201,107,46,0.04)',
                backdropFilter: 'blur(12px)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -13,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#C96B2E',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                }}>BEST VALUE</div>
                <div style={{ fontSize: 13, color: '#C96B2E', fontWeight: 600,
                             textTransform: 'uppercase', letterSpacing: '0.06em',
                             marginBottom: 12 }}>Yearly</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4,
                             marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: 44,
                                fontWeight: 300, color: '#1A1714' }}>
                    <span style={{ fontSize: 22 }}>{sym}</span>
                    {plans.pro_yearly?.amount_display || '89'}
                  </span>
                  <span style={{ color: '#9E8E7E', fontSize: 15 }}>/year</span>
                </div>
                <div style={{ fontSize: 13, color: '#3D7A5F', fontWeight: 500,
                             marginBottom: 20 }}>
                  {plans.pro_yearly?.savings || 'Best value'}
                </div>
                {[
                  'Everything in Monthly',
                  'Two months free',
                  'Early access to new features',
                  'Priority support',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, marginBottom: 8,
                                       fontSize: 14, color: '#6B6560',
                                       alignItems: 'flex-start' }}>
                    <span style={{ color: '#C96B2E', flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
                <button
                  className="btn-mesh"
                  onClick={() => handleUpgrade('pro_yearly')}
                  disabled={!!loading}
                  style={{ width: '100%', padding: '13px', fontSize: 14,
                          marginTop: 20,
                          opacity: loading && loading !== 'pro_yearly' ? 0.5 : 1 }}
                >
                  {loading === 'pro_yearly' ? 'Opening...' : 'Get Yearly — Best Value'}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: '#C0392B', fontSize: 14,
                         textAlign: 'center', marginBottom: 16 }}>
                {error}
              </p>
            )}

            {/* Trust line */}
            <p style={{ textAlign: 'center', fontSize: 13, color: '#9E8E7E',
                       lineHeight: 1.6 }}>
              Secure payment via Razorpay · Cancel anytime ·
              Your conversations are always private
            </p>
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
              style={{ background: 'none', border: 'none',
                      color: '#9E8E7E', fontSize: 13, cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                      textDecoration: 'underline' }}
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
