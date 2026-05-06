import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/axios'

export default function Upgrade() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [pricing, setPricing] = useState(null)

  useEffect(() => {
    api.get('/api/billing/status')
      .then(r => setPricing(r.data))
      .catch(() => {})
  }, [])

  const sym = pricing?.currency_symbol || '$'
  const plans = pricing?.plans || {}

  const PLAN_CARDS = [
    {
      id: 'pro_monthly',
      name: 'Monthly',
      price: `${sym}${plans.pro_monthly?.amount_display || '10'}`,
      period: '/month',
      savings: plans.pro_monthly?.savings || null,
      features: [
        'Unlimited sessions',
        'Full memory & context',
        'All therapist characters',
        'Priority support',
      ]
    },
    {
      id: 'pro_yearly',
      name: 'Yearly',
      price: `${sym}${plans.pro_yearly?.amount_display || '89'}`,
      period: '/year',
      savings: plans.pro_yearly?.savings || null,
      popular: true,
      features: [
        'Everything in Monthly',
        'Best value',
        'Early access to new features',
      ]
    }
  ]

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
        theme: { color: '#C96B2E' },
        handler: async (response) => {
          try {
            await api.post('/api/billing/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId
            })
            navigate('/dashboard', {
              state: { toast: 'Welcome to Sol Pro! 🎉' }
            })
          } catch {
            setError('Payment verified but activation failed. Contact support.')
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
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#C96B2E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontSize: 24,
          margin: '0 auto 20px',
        }}>S</div>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 36,
          fontWeight: 300,
          color: '#1A1714',
          marginBottom: 12,
        }}>You've found your place here.</h1>
        <p style={{ color: '#6B6560', fontSize: 16, maxWidth: 420, margin: '0 auto' }}>
          You've used your 10 free messages. Upgrade to keep going —
          Sol will remember everything you've shared.
        </p>
      </div>

      {/* Plan cards */}
      <div style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 600,
      }}>
        {PLAN_CARDS.map(plan => (
          <div key={plan.id} style={{
            flex: '1 1 240px',
            maxWidth: 280,
            padding: '32px 24px',
            borderRadius: 24,
            background: plan.popular
              ? 'rgba(201,107,46,0.06)'
              : 'rgba(255,252,248,0.8)',
            border: `2px solid ${plan.popular ? '#C96B2E' : '#E8E3DD'}`,
            backdropFilter: 'blur(16px)',
            position: 'relative',
          }}>
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#C96B2E',
                color: 'white',
                padding: '4px 16px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>Most Popular</div>
            )}

            <div style={{ marginBottom: 8, fontSize: 13, color: '#9E8E7E',
                         fontWeight: 600, textTransform: 'uppercase',
                         letterSpacing: '0.06em' }}>
              {plan.name}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4,
                         marginBottom: 4 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 42,
                            fontWeight: 300, color: '#1A1714' }}>
                {plan.price}
              </span>
              <span style={{ color: '#9E8E7E', fontSize: 14 }}>{plan.period}</span>
            </div>

            {plan.savings && (
              <div style={{ color: '#3D7A5F', fontSize: 13, fontWeight: 500,
                           marginBottom: 20 }}>
                {plan.savings}
              </div>
            )}

            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 24px',
                        display: 'flex', flexDirection: 'column', gap: 8 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start',
                                    gap: 8, fontSize: 14, color: '#6B6560' }}>
                  <span style={{ color: '#C96B2E', flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={!!loading}
              className="btn-mesh"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 15,
                opacity: loading && loading !== plan.id ? 0.5 : 1,
              }}
            >
              {loading === plan.id ? 'Opening checkout...' : 'Get Pro'}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ color: '#C0392B', marginTop: 16, fontSize: 14 }}>{error}</p>
      )}

      <button
        onClick={() => navigate('/dashboard')}
        style={{ marginTop: 24, background: 'none', border: 'none',
                color: '#9E8E7E', cursor: 'pointer', fontSize: 14,
                fontFamily: 'DM Sans, sans-serif' }}
      >
        ← Back to dashboard
      </button>

    </div>
  )
}
