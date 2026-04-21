import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Home, Clock, Brain, Settings } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/axios'
import { EarlyMemberCard } from '../early-member/EarlyMemberCard'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/sessions', label: 'Sessions', icon: Clock },
  { path: '/memory', label: 'Memory', icon: Brain },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [isPro, setIsPro] = useState(null) // null = loading
  const cacheRef = useRef({ data: null, timestamp: 0 })

  useEffect(() => {
    const fetchBillingStatus = async () => {
      const now = Date.now()
      if (cacheRef.current.data && now - cacheRef.current.timestamp < 60000) {
        setIsPro(cacheRef.current.data.is_pro === true)
        return
      }
      try {
        const res = await api.get('/api/billing/status')
        cacheRef.current = { data: res.data, timestamp: now }
        setIsPro(res.data.is_pro === true)
      } catch (e) {
        setIsPro(false)
      }
    }
    fetchBillingStatus()
  }, [])

  const initials = user?.email?.[0]?.toUpperCase() || 'U'
  const displayName = user?.user_metadata?.preferred_name
    || user?.email?.split('@')[0]
    || 'You'

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <aside style={{
      width: 260,
      height: '100vh',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderRight: '1px solid var(--glass-border)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 32,
      paddingBottom: 24,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      overflowY: 'auto',
      overflowX: 'visible',
    }}>

      {/* Logo */}
      <div style={{
        padding: '0 24px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
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
          fontSize: 16,
          flexShrink: 0,
        }}>S</div>
        <span style={{
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontSize: 22,
          color: '#1A1714',
          fontWeight: 300,
        }}>Sol</span>
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#3D7A5F',
          marginLeft: 2,
          marginBottom: 8,
          flexShrink: 0,
        }} />
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              textDecoration: 'none',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? '#C96B2E' : '#6B6560',
              background: isActive ? '#F5E6D8' : 'transparent',
              transition: 'all 150ms ease',
            })}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade or Pro badge */}
      {isPro === false && (
        <div style={{
          margin: '8px 12px 16px',
          padding: '16px',
          borderRadius: 14,
          background: 'rgba(201,107,46,0.06)',
          border: '1px solid rgba(201,107,46,0.15)',
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#C96B2E',
            fontFamily: 'DM Sans, sans-serif',
            marginBottom: 4,
          }}>✦ Sol Pro</div>
          <div style={{
            fontSize: 12,
            color: '#6B6560',
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.5,
            marginBottom: 12,
          }}>
            Unlimited sessions,<br />full memory, no limits.
          </div>
          <NavLink
            to="/upgrade"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '8px 12px',
              borderRadius: 999,
              background: '#C96B2E',
              color: 'white',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'filter 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            Upgrade — $9/mo
          </NavLink>
        </div>
      )}

      {isPro === true && (
        <div style={{
          margin: '8px 12px 16px',
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(61,122,95,0.06)',
          border: '1px solid rgba(61,122,95,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ color: '#3D7A5F', fontSize: 14 }}>✦</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                        color: '#3D7A5F', fontWeight: 500 }}>
            Sol Pro · Active
          </span>
        </div>
      )}

      {/* Early Member Card */}
      {profile?.is_early_member && (
        <EarlyMemberCard profile={profile} />
      )}

      {/* Bottom: profile + sign out */}
      <div style={{ padding: '16px 16px 0', borderTop: '1px solid #E8E3DD' }}>
        <NavLink
          to="/profile"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 10px',
            borderRadius: 10,
            textDecoration: 'none',
            background: isActive ? '#F5E6D8' : 'transparent',
            marginBottom: 4,
          })}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: '2px solid #E8E3DD',
              }}
              onError={(e) => {
                e.target.style.display = 'none'
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#E8E3DD',
            display: profile?.avatar_url ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            color: '#6B6560',
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              color: '#1A1714',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{displayName}</div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              color: '#6B6560',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{user?.email}</div>
          </div>
        </NavLink>

        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'none',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#6B6560',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'color 150ms',
          }}
          onMouseEnter={e => e.target.style.color = '#C0392B'}
          onMouseLeave={e => e.target.style.color = '#6B6560'}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
