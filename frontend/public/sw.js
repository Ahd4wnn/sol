const CACHE_NAME = 'sol-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline.html',
]

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return // never cache API

  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return res
      })
      .catch(() => caches.match(event.request)
        .then(cached => cached || caches.match('/offline.html'))
      )
  )
})

// Push notification handler
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() || {}
  } catch (e) {
    data = {
      title: 'Sol ☀️',
      body: event.data?.text() || 'Sol is here whenever you need it.'
    }
  }

  const title = data.title || 'Sol ☀️'
  const options = {
    body: data.body || "Sol is here whenever you need it.",
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
    tag: data.tag || 'sol-notification',
    renotify: true,
    requireInteraction: false,
    silent: false,
    actions: [
      { action: 'open', title: 'Open Sol' },
      { action: 'dismiss', title: 'Later' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) &&
            'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Open new tab
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
