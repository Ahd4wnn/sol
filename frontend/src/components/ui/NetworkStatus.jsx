import { useState, useEffect } from 'react'

export function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [backendOk, setBackendOk] = useState(true)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const checkBackend = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/health`, {
          signal: AbortSignal.timeout(5000)
        })
        setBackendOk(res.ok)
      } catch {
        setBackendOk(false)
        console.warn('[NetworkStatus] Backend unreachable')
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (online && backendOk) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: online ? '#C0392B' : '#1A1714',
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
      {!online ? '⚠ No internet connection' : '⚠ Cannot reach Sol server — is the backend running?'}
    </div>
  )
}
