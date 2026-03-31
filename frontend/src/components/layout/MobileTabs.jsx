import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Clock, Brain, Settings, User, Plus } from 'lucide-react'

const TABS = [
  { path: '/dashboard', icon: <Home size={22} />, label: 'Home' },
  { path: '/sessions',  icon: <Clock size={22} />, label: 'Sessions' },
  { path: '/session/new', icon: <Plus size={26} />, label: 'New', isCenter: true },
  { path: '/memory',    icon: <Brain size={22} />, label: 'Memory' },
  { path: '/profile',   icon: <User size={22} />, label: 'Profile' },
]

export function MobileTabs() {
  return (
    <nav className="sol-mobile-tabs" style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100vw - 48px)',
      maxWidth: 400,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      background: 'rgba(255, 252, 248, 0.75)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.8)',
      boxShadow: '0 8px 32px rgba(201,107,46,0.18), 0 2px 8px rgba(0,0,0,0.08)',
      zIndex: 200,
      padding: '0 8px',
    }}>
      {TABS.map(({ path, icon, label, isCenter }) => {
        if (isCenter) {
          return (
            <NavLink key={path} to={path} style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--mesh-button)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 26,
              fontWeight: 300,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(201,107,46,0.5)',
              marginTop: -20,   /* lifts above the bar */
              flexShrink: 0,
              transition: 'transform 150ms ease, box-shadow 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.08)'
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,107,46,0.65)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,107,46,0.5)'
            }}>
              {icon}
            </NavLink>
          )
        }

        return (
          <NavLink key={path} to={path} style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            textDecoration: 'none',
            color: isActive ? '#C96B2E' : '#9E9089',
            fontSize: 9,
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: isActive ? 500 : 400,
            flex: 1,
            padding: '8px 4px',
            borderRadius: 12,
            transition: 'color 150ms',
            minWidth: 0,
          })}>
            {({ isActive }) => (
              <>
                <span style={{
                  lineHeight: 1,
                  filter: isActive
                    ? 'drop-shadow(0 0 6px rgba(201,107,46,0.5))'
                    : 'none',
                  transition: 'filter 200ms',
                }}>{icon}</span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
