import { useState, useEffect } from 'react'
import api from '../lib/api'

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  const [subscribed, setSubscribed] = useState(false)

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const { data } = await api.get('/api/push/vapid-public-key')

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.public_key)
      })

      await api.post('/api/push/subscribe', subscription.toJSON())
      setSubscribed(true)
      localStorage.setItem('sol_push_subscribed', '1')
    } catch (err) {
      console.error('[Push] Subscribe failed:', err)
    }
  }

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await api.post('/api/push/unsubscribe', { endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
      setSubscribed(false)
      localStorage.removeItem('sol_push_subscribed')
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err)
    }
  }

  useEffect(() => {
    setSubscribed(localStorage.getItem('sol_push_subscribed') === '1')
  }, [])

  return { permission, subscribed, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
