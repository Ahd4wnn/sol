import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/axios'

const ADMIN_EMAIL = 'your@email.com'  // hardcode your email here

export default function Admin() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [feedback, setFeedback] = useState([])
  const [codes, setCodes] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [giftUserId, setGiftUserId] = useState('')
  const [giftPlan, setGiftPlan] = useState('pro_monthly')
  const [giftNote, setGiftNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [appSettings, setAppSettings] = useState({})

  const [creators, setCreators] = useState([])
  const [newCreator, setNewCreator] = useState({
    name: '', email: '', handle: '',
    promo_code: '', ref_slug: '',
    commission_rate: 30, user_discount: 20,
    bonus_messages: 10, password: '', payout_info: ''
  })
  const [showNewCreatorForm, setShowNewCreatorForm] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState(null)

  useEffect(() => {
    if (!profile) return
    // We check against the profile's email (if we had it), or we just let it fetch and fail if not admin
    loadData()
  }, [profile])

  const loadCreators = async () => {
    const res = await api.get('/api/admin/creators').catch(e => ({ data: { creators: [] } }))
    setCreators(res.data?.creators || [])
  }

  const loadAppSettings = async () => {
    const res = await api.get('/api/admin/app-settings').catch(e => ({ data: { settings: {} } }))
    setAppSettings(res.data?.settings || {})
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, feedbackRes, codesRes] = await Promise.all([
        api.get('/api/admin/stats').catch(e => ({ data: null })),
        api.get('/api/admin/users').catch(e => ({ data: { users: [] } })),
        api.get('/api/admin/feedback?resolved=false').catch(e => ({ data: { feedback: [] } })),
        api.get('/api/admin/codes').catch(e => ({ data: { codes: [] } })),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data?.users || [])
      setFeedback(feedbackRes.data?.feedback || [])
      setCodes(codesRes.data?.codes || [])
      await loadCreators()
      await loadAppSettings()
    } catch (err) {
      console.error('Admin load failed:', err)
      if (err.response?.status === 403) navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleGiftPro = async () => {
    if (!giftUserId) return
    try {
      await api.post('/api/admin/gift-pro', {
        user_id: giftUserId,
        plan: giftPlan,
        note: giftNote || 'Gifted by admin'
      })
      alert('Pro gifted successfully!')
      setGiftUserId('')
      setGiftNote('')
      loadData()
    } catch (err) {
      alert('Failed to gift pro: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleRevokePro = async (userId) => {
    if (!confirm('Revoke Pro from this user?')) return
    try {
      await api.post('/api/admin/revoke-pro', { user_id: userId })
      loadData()
    } catch (err) {
      alert('Failed to revoke')
    }
  }

  const handleResolveFeedback = async (id) => {
    try {
      await api.patch(`/api/admin/feedback/${id}/resolve`)
      setFeedback(prev => prev.filter(f => f.id !== id))
    } catch (err) {
      alert('Failed to resolve')
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
                 justifyContent: 'center', background: '#F9F7F4',
                 fontFamily: 'DM Sans, sans-serif', color: '#6B6560' }}>
      Loading admin panel...
    </div>
  )

  const TABS = ['overview', 'users', 'feedback', 'gift', 'codes', 'creators']

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7F4',
                 fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#1A1714', padding: '20px 40px',
                   display: 'flex', alignItems: 'center',
                   justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                        fontSize: 22, color: '#C96B2E' }}>Sol</span>
          <span style={{ color: '#6B6560', fontSize: 14 }}>Admin Panel</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: '1px solid #2E2A24',
                  color: '#9E8E7E', padding: '8px 16px', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13,
                  fontFamily: 'DM Sans, sans-serif' }}>
          ← Back to App
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E8E3DD',
                   padding: '0 40px', display: 'flex', gap: 4 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '14px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab
                ? '2px solid #C96B2E' : '2px solid transparent',
              color: activeTab === tab ? '#C96B2E' : '#6B6560',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              fontWeight: activeTab === tab ? 500 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300,
                        fontSize: 28, marginBottom: 24 }}>Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                         gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Users', value: stats.users.total, color: '#C96B2E' },
                { label: 'Pro Subscribers', value: stats.users.pro, color: '#3D7A5F' },
                { label: 'Conversion Rate', value: `${stats.users.conversion_rate}%`, color: '#7B5EA7' },
                { label: 'MRR (est.)', value: `$${stats.revenue.monthly_recurring}`, color: '#C96B2E' },
                { label: 'Total Revenue', value: `$${stats.revenue.total_collected}`, color: '#3D7A5F' },
                { label: 'Monthly Subs', value: stats.revenue.monthly_subs, color: '#6B6560' },
                { label: 'Yearly Subs', value: stats.revenue.yearly_subs, color: '#6B6560' },
                { label: 'Total Sessions', value: stats.usage.total_sessions, color: '#6B6560' },
                { label: 'Total Messages', value: stats.usage.total_messages, color: '#6B6560' },
                { label: 'Open Feedback', value: stats.feedback.unresolved, color: '#C0392B' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'white', borderRadius: 16,
                  border: '1px solid #E8E3DD', padding: '24px 20px',
                }}>
                  <div style={{ fontSize: 32, fontFamily: 'Fraunces, serif',
                               fontWeight: 300, color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: '#9E8E7E', marginTop: 4 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300,
                        fontSize: 28, marginBottom: 24 }}>
              Users ({users.length})
            </h2>
            <div style={{ background: 'white', borderRadius: 16,
                         border: '1px solid #E8E3DD', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9F7F4' }}>
                    {['Name', 'Plan', 'Status', 'Messages', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left',
                                         fontSize: 12, color: '#9E8E7E',
                                         fontWeight: 600, textTransform: 'uppercase',
                                         letterSpacing: '0.05em',
                                         borderBottom: '1px solid #E8E3DD' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{
                      borderBottom: i < users.length - 1
                        ? '1px solid #F0EBE5' : 'none'
                    }}>
                      <td style={{ padding: '12px 16px', fontSize: 14,
                                  color: '#1A1714' }}>
                        <div>{u.preferred_name || u.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#9E8E7E', fontFamily: 'monospace', marginTop: 4 }}>
                          {u.id}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 12,
                          fontWeight: 500,
                          background: u.plan === 'free' ? '#F0EBE5' : '#E8F5EF',
                          color: u.plan === 'free' ? '#9E8E7E' : '#3D7A5F',
                        }}>
                          {u.plan}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13,
                                  color: '#6B6560' }}>
                        {u.sub_status}
                        {u.gifted_note && (
                          <span style={{ fontSize: 11, color: '#C96B2E',
                                        marginLeft: 6 }}>
                            (gifted)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14,
                                  color: '#6B6560' }}>
                        {u.total_messages_sent || 0}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13,
                                  color: '#9E8E7E' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.plan !== 'free' ? (
                          <button onClick={() => handleRevokePro(u.id)}
                            style={{ fontSize: 12, color: '#C0392B',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', padding: '4px 8px',
                                    fontFamily: 'DM Sans, sans-serif' }}>
                            Revoke Pro
                          </button>
                        ) : (
                          <button onClick={() => {
                            setGiftUserId(u.id)
                            setActiveTab('gift')
                          }}
                            style={{ fontSize: 12, color: '#3D7A5F',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', padding: '4px 8px',
                                    fontFamily: 'DM Sans, sans-serif' }}>
                            Gift Pro
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div>
            {/* ── TOGGLE ── */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              background: 'white',
              borderRadius: 16,
              border: '1px solid #E8E3DD',
              marginBottom: 24,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#1A1714' }}>
                  User Feedback Section
                </div>
                <div style={{ fontSize: 13, color: '#9E8E7E', marginTop: 2 }}>
                  Show or hide the feedback form in users' Profile pages
                </div>
              </div>
              <button
                onClick={async () => {
                  const current = appSettings['feedback_enabled']
                  const newVal = current === false ? true : false
                  await api.patch('/api/admin/app-settings/feedback_enabled',
                    { value: newVal })
                  setAppSettings(prev => ({
                    ...prev, feedback_enabled: newVal
                  }))
                }}
                style={{
                  width: 52, height: 28,
                  borderRadius: 999,
                  border: 'none',
                  background: appSettings['feedback_enabled'] === false
                    ? '#E8E3DD' : '#C96B2E',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 200ms',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 4,
                  left: appSettings['feedback_enabled'] === false ? 4 : 24,
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 200ms ease',
                }} />
              </button>
            </div>

            {/* ── SOL CHAT FEEDBACK (existing) ── */}
            <h3 style={{
              fontFamily: 'Fraunces, serif', fontWeight: 300,
              fontSize: 20, marginBottom: 16, color: '#1A1714',
            }}>In-Chat Feedback</h3>
            
            {feedback.length === 0 ? (
              <p style={{ color: '#9E8E7E' }}>No unresolved feedback. 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedback.map(f => (
                  <div key={f.id} style={{
                    background: 'white', borderRadius: 16,
                    border: '1px solid #E8E3DD', padding: '20px 24px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: 16,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 999, fontSize: 11,
                          fontWeight: 600, textTransform: 'uppercase',
                          background: '#FEF0E6', color: '#C96B2E',
                        }}>{f.category}</span>
                        <span style={{
                          padding: '2px 10px', borderRadius: 999, fontSize: 11,
                          fontWeight: 600, textTransform: 'uppercase',
                          background: '#FEE8E8', color: '#C0392B',
                        }}>{f.sentiment}</span>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: 15,
                                 color: '#1A1714', fontStyle: 'italic' }}>
                        "{f.feedback_text}"
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#9E8E7E' }}>
                        {new Date(f.created_at).toLocaleString()}
                        {f.profiles?.preferred_name && ` · ${f.profiles.preferred_name}`}
                      </p>
                    </div>
                    <button onClick={() => handleResolveFeedback(f.id)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: '#E8F5EF', color: '#3D7A5F', cursor: 'pointer',
                        fontSize: 13, fontWeight: 500, flexShrink: 0,
                        fontFamily: 'DM Sans, sans-serif',
                      }}>
                      Resolve ✓
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── USER PROFILE FEEDBACK ── */}
            <h3 style={{
              fontFamily: 'Fraunces, serif', fontWeight: 300,
              fontSize: 20, margin: '32px 0 16px', color: '#1A1714',
            }}>User Feedback Submissions</h3>

            <UserFeedbackList />
          </div>
        )}

        {/* GIFT TAB */}
        {activeTab === 'gift' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300,
                        fontSize: 28, marginBottom: 24 }}>
              Gift Pro Access
            </h2>
            <div style={{ background: 'white', borderRadius: 20,
                         border: '1px solid #E8E3DD', padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#6B6560',
                                 display: 'block', marginBottom: 6 }}>
                    User ID
                  </label>
                  <input
                    value={giftUserId}
                    onChange={e => setGiftUserId(e.target.value)}
                    placeholder="Paste user UUID from Users tab"
                    style={{
                      width: '100%', padding: '12px 16px',
                      border: '1px solid #E8E3DD', borderRadius: 12,
                      fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B6560',
                                 display: 'block', marginBottom: 6 }}>
                    Plan
                  </label>
                  <select
                    value={giftPlan}
                    onChange={e => setGiftPlan(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px',
                      border: '1px solid #E8E3DD', borderRadius: 12,
                      fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                      outline: 'none', background: 'white',
                    }}
                  >
                    <option value="pro_monthly">Pro Monthly (30 days)</option>
                    <option value="pro_yearly">Pro Yearly (365 days)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B6560',
                                 display: 'block', marginBottom: 6 }}>
                    Note (optional)
                  </label>
                  <input
                    value={giftNote}
                    onChange={e => setGiftNote(e.target.value)}
                    placeholder="e.g. Beta tester, scholarship, friend..."
                    style={{
                      width: '100%', padding: '12px 16px',
                      border: '1px solid #E8E3DD', borderRadius: 12,
                      fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  onClick={handleGiftPro}
                  disabled={!giftUserId}
                  className="btn-mesh"
                  style={{ padding: '14px', fontSize: 15,
                          opacity: !giftUserId ? 0.5 : 1 }}>
                  Gift Pro Access 🎁
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CODES TAB */}
        {activeTab === 'codes' && (
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300,
                        fontSize: 28, marginBottom: 24 }}>
              Early Access Codes ({codes.length})
            </h2>
            <div style={{ background: 'white', borderRadius: 20,
                         border: '1px solid #E8E3DD', padding: '32px', marginBottom: 24 }}>
              <button
                onClick={async () => {
                  try {
                    const res = await api.post('/api/admin/generate-codes')
                    alert(`Generated ${res.data.count} codes!`)
                    loadData()
                  } catch (e) {
                    alert('Error: ' + (e.response?.data?.detail || e.message))
                  }
                }}
                className="btn-mesh"
                style={{ width: '100%', padding: '14px', fontSize: 14 }}
              >
                Generate 100 Early Codes
              </button>
              <p style={{ fontSize: 13, color: '#6B6560', marginTop: 16, textAlign: 'center' }}>
                Note: This generates numbers 1-100 without overwriting existing ones.
              </p>
            </div>

            {codes.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16,
                           border: '1px solid #E8E3DD', overflow: 'hidden' }}>
                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F9F7F4' }}>
                      <tr>
                        {['No.', 'Code', 'Status', 'Redeemed By', 'Date'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left',
                                             fontSize: 12, color: '#9E8E7E',
                                             fontWeight: 600, textTransform: 'uppercase',
                                             letterSpacing: '0.05em',
                                             borderBottom: '1px solid #E8E3DD' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c, i) => (
                        <tr key={c.id} style={{
                          borderBottom: i < codes.length - 1 ? '1px solid #F0EBE5' : 'none'
                        }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#1A1714', fontWeight: 500 }}>
                            #{String(c.member_number).padStart(3, '0')}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B6560', fontFamily: 'monospace' }}>
                            {c.code}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                              background: c.redeemed_by ? '#FEE8E8' : '#E8F5EF',
                              color: c.redeemed_by ? '#C0392B' : '#3D7A5F',
                            }}>
                              {c.redeemed_by ? 'Redeemed' : 'Available'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B6560' }}>
                            {c.profiles?.preferred_name || c.profiles?.full_name || c.profiles?.email || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#9E8E7E' }}>
                            {c.redeemed_at ? new Date(c.redeemed_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CREATORS TAB */}
        {activeTab === 'creators' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center',
                         justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300,
                          fontSize: 28 }}>Creators ({creators.length})</h2>
              <button
                onClick={() => setShowNewCreatorForm(true)}
                className="btn-mesh"
                style={{ padding: '10px 20px', fontSize: 13 }}
              >+ Add Creator</button>
            </div>

            {/* New creator form */}
            {showNewCreatorForm && (
              <div style={{
                background: 'white', borderRadius: 16,
                border: '1px solid #E8E3DD', padding: 24,
                marginBottom: 24,
              }}>
                <h3 style={{ marginBottom: 20, fontWeight: 500 }}>New Creator</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                             gap: 12 }}>
                  {[
                    { key: 'name', label: 'Full Name', placeholder: 'Alex Creator' },
                    { key: 'email', label: 'Email', placeholder: 'alex@gmail.com' },
                    { key: 'handle', label: 'Social Handle', placeholder: '@alexcreates' },
                    { key: 'password', label: 'Password (for dashboard login)', placeholder: '••••••••', type: 'password' },
                    { key: 'promo_code', label: 'Promo Code', placeholder: 'ALEX20' },
                    { key: 'ref_slug', label: 'Ref Slug', placeholder: 'alex' },
                    { key: 'commission_rate', label: 'Commission %', placeholder: '30' },
                    { key: 'user_discount', label: 'User Discount %', placeholder: '20' },
                    { key: 'bonus_messages', label: 'Bonus Messages', placeholder: '10' },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ fontSize: 12, color: '#9E8E7E', display: 'block',
                                     marginBottom: 4 }}>{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={newCreator[field.key]}
                        onChange={e => setNewCreator(prev => ({
                          ...prev, [field.key]: e.target.value
                        }))}
                        style={{
                          width: '100%', padding: '10px 12px',
                          border: '1px solid #E8E3DD', borderRadius: 10,
                          fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 12, color: '#9E8E7E', display: 'block',
                                   marginBottom: 4 }}>Payout Info (bank/UPI)</label>
                    <textarea
                      placeholder="UPI: alex@upi or Bank: HDFC XXXX..."
                      value={newCreator.payout_info}
                      onChange={e => setNewCreator(prev => ({
                        ...prev, payout_info: e.target.value
                      }))}
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: '1px solid #E8E3DD', borderRadius: 10,
                        fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                        outline: 'none', resize: 'none', minHeight: 70,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={async () => {
                      try {
                        await api.post('/api/admin/creators', newCreator)
                        setShowNewCreatorForm(false)
                        setNewCreator({
                          name: '', email: '', handle: '',
                          promo_code: '', ref_slug: '',
                          commission_rate: 30, user_discount: 20,
                          bonus_messages: 10, password: '', payout_info: ''
                        })
                        loadCreators()
                        alert('Creator added!')
                      } catch(e) {
                        alert('Error: ' + (e.response?.data?.detail?.message || e.message))
                      }
                    }}
                    className="btn-mesh"
                    style={{ padding: '10px 24px', fontSize: 14 }}
                  >Create Creator</button>
                  <button
                    onClick={() => setShowNewCreatorForm(false)}
                    style={{ padding: '10px 20px', background: 'none',
                            border: '1px solid #E8E3DD', borderRadius: 999,
                            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                            fontSize: 14 }}
                  >Cancel</button>
                </div>
              </div>
            )}

            {/* Creator cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {creators.map(creator => (
                <div key={creator.id} style={{
                  background: 'white', borderRadius: 16,
                  border: '1px solid #E8E3DD', padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start',
                               justifyContent: 'space-between', flexWrap: 'wrap',
                               gap: 16 }}>
                    {/* Left info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                                   marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 16,
                                     color: '#1A1714' }}>{creator.name}</div>
                        <span style={{ fontSize: 13, color: '#9E8E7E' }}>
                          {creator.handle}
                        </span>
                        <span style={{
                          padding: '2px 10px', borderRadius: 999, fontSize: 11,
                          fontWeight: 600,
                          background: creator.status === 'active'
                            ? '#E8F5EF' : '#FEE8E8',
                          color: creator.status === 'active' ? '#3D7A5F' : '#C0392B',
                        }}>{creator.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 13,
                                   color: '#6B6560', flexWrap: 'wrap' }}>
                        <span>Code: <strong>{creator.promo_code}</strong></span>
                        <span>Link: <strong>?ref={creator.ref_slug}</strong></span>
                        <span>Commission: <strong>{creator.commission_rate}%</strong></span>
                        <span>User discount: <strong>{creator.user_discount}%</strong></span>
                      </div>
                      {creator.payout_info && (
                        <div style={{ fontSize: 12, color: '#9E8E7E', marginTop: 6 }}>
                          💳 {creator.payout_info}
                        </div>
                      )}
                    </div>

                    {/* Right — earnings */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontFamily: 'Fraunces, serif',
                                   fontWeight: 300, color: '#C96B2E' }}>
                        ${(creator.total_earnings || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: '#9E8E7E' }}>total earned</div>
                      <div style={{ fontSize: 13, color: '#3D7A5F', marginTop: 2 }}>
                        ${((creator.total_earnings || 0) -
                           (creator.total_paid || 0)).toFixed(2)} pending
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 16,
                               borderTop: '1px solid #F0EBE5', paddingTop: 14 }}>
                    <button
                      onClick={async () => {
                        const amount = (creator.total_earnings || 0) -
                                       (creator.total_paid || 0)
                        if (amount <= 0) return alert('Nothing to pay out.')
                        const notes = prompt(`Paying $${amount.toFixed(2)} to ${creator.name}. Add a note (optional):`)
                        if (notes === null) return
                        await api.post(`/api/admin/creators/${creator.id}/payout`,
                          { amount, notes })
                        loadCreators()
                        alert(`Payout of $${amount.toFixed(2)} marked as paid!`)
                      }}
                      style={{
                        padding: '7px 16px', borderRadius: 8,
                        background: '#E8F5EF', color: '#3D7A5F',
                        border: 'none', cursor: 'pointer', fontSize: 13,
                        fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                      }}
                    >Mark Paid 💸</button>

                    <button
                      onClick={async () => {
                        const newStatus = creator.status === 'active' ? 'paused' : 'active'
                        await api.patch(`/api/admin/creators/${creator.id}`,
                          { status: newStatus })
                        loadCreators()
                      }}
                      style={{
                        padding: '7px 16px', borderRadius: 8,
                        background: '#F0EBE5', color: '#9E8E7E',
                        border: 'none', cursor: 'pointer', fontSize: 13,
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >{creator.status === 'active' ? 'Pause' : 'Activate'}</button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}?ref=${creator.ref_slug}`
                        )
                        alert('Referral link copied!')
                      }}
                      style={{
                        padding: '7px 16px', borderRadius: 8,
                        background: '#F9F7F4', color: '#6B6560',
                        border: '1px solid #E8E3DD', cursor: 'pointer',
                        fontSize: 13, fontFamily: 'DM Sans, sans-serif',
                      }}
                    >Copy Link 🔗</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function UserFeedbackList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/api/admin/user-feedback')
      .then(r => setItems(r.data.feedback || []))
      .finally(() => setLoading(false))
  }, [])

  const QUESTION_LABELS = {
    q1: "What stuck with them",
    q2: "What Sol gets wrong",
    q3: "What they're looking for",
    q4: "What would make them open Sol daily",
    q5: "Favourite archetype",
    q6: "What Sol can't help with yet",
    q7: "What they'd miss",
    q8: "Trust level (1-5)",
    q9: "What they'd tell a friend",
    q10: "What we should have asked",
  }

  if (loading) return (
    <div style={{ padding: 24, color: '#9E8E7E', fontSize: 14 }}>
      Loading...
    </div>
  )

  if (!items.length) return (
    <div style={{
      padding: 24, textAlign: 'center',
      color: '#9E8E7E', fontSize: 14,
    }}>
      No user feedback yet. Enable the form and share the word. ☀️
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={item.id} style={{
          background: 'white',
          borderRadius: 14,
          border: '1px solid #E8E3DD',
          overflow: 'hidden',
        }}>
          {/* Row header */}
          <div
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#F0EBE5',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600, fontSize: 13, color: '#C96B2E',
              }}>
                {(item.profiles?.preferred_name ||
                  item.profiles?.full_name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500,
                             color: '#1A1714' }}>
                  {item.profiles?.preferred_name ||
                   item.profiles?.full_name || 'Anonymous'}
                </div>
                <div style={{ fontSize: 12, color: '#9E8E7E' }}>
                  {new Date(item.submitted_at).toLocaleDateString()} ·
                  feeling {item.mood_at_time || 'unknown'}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: 14, color: '#9E8E7E',
              transform: expanded === i ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 200ms',
              display: 'inline-block',
            }}>▾</span>
          </div>

          {/* Expanded answers */}
          {expanded === i && (
            <div style={{
              borderTop: '1px solid #F0EBE5',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              {Object.entries(item.answers || {}).map(([key, val]) => (
                val ? (
                  <div key={key}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#C96B2E',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      marginBottom: 4,
                    }}>
                      {QUESTION_LABELS[key] || key}
                    </div>
                    <div style={{
                      fontSize: 14, color: '#1A1714', lineHeight: 1.6,
                    }}>
                      {typeof val === 'number' ? `${val} / 5` : val}
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
