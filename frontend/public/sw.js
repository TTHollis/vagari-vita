/**
 * Vagari Vita service worker.
 *
 * Strategy:
 *  - HTML (navigation requests): network-first, fall back to cache when offline.
 *    Ensures users always get the latest code on deploy, no manual cache clear.
 *  - Static assets (JS, CSS, images): cache-first. Vite generates hashed filenames
 *    so each deploy has unique URLs — caching them forever is safe.
 *  - API requests (/api/*): pass through to network, never cached.
 */

const CACHE = 'vagari-vita-v1'
const PRECACHE = ['/']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Never cache API
  if (url.pathname.startsWith('/api/')) return

  // Only handle same-origin GETs
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return

  // Network-first for HTML / navigation
  const isHtml =
    e.request.mode === 'navigate' ||
    e.request.headers.get('accept')?.includes('text/html')

  if (isHtml) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
          return response
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('/')))
    )
    return
  }

  // Cache-first for static assets (hashed by Vite, safe to cache forever)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return response
      })
    })
  )
})
