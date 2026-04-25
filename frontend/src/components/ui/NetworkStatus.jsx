import { useState, useEffect } from 'react'

export function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Only show when browser is actually offline
  // Don't show backend unreachable — let components handle their own errors
  if (online) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1A1714',
      color: 'white',
      padding: '10px 20px',
      borderRadius: 999,
      fontSize: 14,
      fontFamily: 'DM Sans, sans-serif',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      ⚠ No internet connection
    </div>
  )
}
