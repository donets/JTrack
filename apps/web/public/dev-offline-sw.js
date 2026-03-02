const CACHE_NAME = 'jtrack-dev-offline-v2'
const APP_SHELL_URL = '/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(APP_SHELL_URL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('jtrack-dev-offline-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

async function networkFirstAsset(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  } catch (_error) {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    })
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  } catch (_error) {
    const cachedRoute = await cache.match(request)
    if (cachedRoute) {
      return cachedRoute
    }

    const appShell = await cache.match(APP_SHELL_URL)
    if (appShell) {
      return appShell
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  const isStaticAsset =
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_nuxt/')

  if (isStaticAsset) {
    event.respondWith(networkFirstAsset(request))
  }
})
