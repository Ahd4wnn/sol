import { useState, useEffect } from 'react'
import api from '../lib/api'

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check actual subscription status on mount
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          const hasLocal = localStorage.getItem('sol_push_subscribed') === '1'
          setSubscribed(!!sub && hasLocal)
          // If localStorage says subscribed but no actual sub, resync
          if (hasLocal && !sub) {
            localStorage.removeItem('sol_push_subscribed')
            setSubscribed(false)
          }
        })
      })
    }
  }, [])

  const subscribe = async () => {
    if (loading) return
    setLoading(true)

    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers not supported')
      }
      if (!('PushManager' in window)) {
        throw new Error('Push notifications not supported')
      }

      // Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        console.log('[Push] Permission denied')
        return
      }

      // Wait for SW to be ready
      const reg = await navigator.serviceWorker.ready
      console.log('[Push] SW ready:', reg.scope)

      // Get VAPID key
      const { data } = await api.get('/api/push/vapid-public-key')
      console.log('[Push] Got VAPID key')

      // Unsubscribe from any existing subscription first
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        await existing.unsubscribe()
        console.log('[Push] Unsubscribed from old subscription')
      }

      // Create new subscription
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.public_key)
      })
      console.log('[Push] New subscription created:', subscription.endpoint)

      // Send to backend
      await api.post('/api/push/subscribe', subscription.toJSON())
      console.log('[Push] Subscription saved to backend')

      setSubscribed(true)
      localStorage.setItem('sol_push_subscribed', '1')

      // Send a test notification immediately
      await api.post('/api/push/test')

    } catch (err) {
      console.error('[Push] Subscribe failed:', err.message)
      alert(`Notification setup failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await api.post('/api/push/unsubscribe', { endpoint: sub.endpoint })
        await sub.unsubscribe()
        console.log('[Push] Unsubscribed')
      }
      setSubscribed(false)
      localStorage.removeItem('sol_push_subscribed')
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err)
    }
  }

  return { permission, subscribed, subscribe, unsubscribe, loading }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
