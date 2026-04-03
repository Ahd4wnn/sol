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
  const [activeTab, setActiveTab] = useState('overview')
  const [giftUserId, setGiftUserId] = useState('')
  const [giftPlan, setGiftPlan] = useState('pro_monthly')
  const [giftNote, setGiftNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    // We check against the profile's email (if we had it), or we just let it fetch and fail if not admin
    loadData()
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, feedbackRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/feedback?resolved=false'),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data.users || [])
      setFeedback(feedbackRes.data.feedback || [])
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

  const TABS = ['overview', 'users', 'feedback', 'gift']

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
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300,
                        fontSize: 28, marginBottom: 24 }}>
              Unresolved Feedback ({feedback.length})
            </h2>
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
      </div>
    </div>
  )
}
