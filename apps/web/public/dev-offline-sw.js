const CACHE_NAME = 'jtrack-dev-offline-v4'
const APP_SHELL_URL = '/'
const SHELL_ROUTES = ['/', '/login', '/dashboard', '/tickets', '/locations', '/dispatch']
const MODULE_GRAPH_ENTRYPOINTS = [
  '/_nuxt/layouts/auth.vue',
  '/_nuxt/layouts/default.vue',
  '/_nuxt/pages/login.vue',
  '/_nuxt/pages/dashboard.vue',
  '/_nuxt/pages/tickets/index.vue'
]
const MODULE_GRAPH_LIMIT = 400

const toAbsoluteUrl = (value) => new URL(value, self.location.origin).toString()

const isCacheableLocalUrl = (rawUrl) => {
  if (!rawUrl) {
    return false
  }

  if (
    rawUrl.startsWith('data:') ||
    rawUrl.startsWith('blob:') ||
    rawUrl.startsWith('javascript:')
  ) {
    return false
  }

  const url = new URL(rawUrl, self.location.origin)
  return url.origin === self.location.origin
}

const extractShellAssets = (html) => {
  const urls = new Set()
  const pattern = /<(?:script|link)[^>]+(?:src|href)=["']([^"']+)["']/gi
  let match = pattern.exec(html)

  while (match) {
    const rawUrl = match[1]
    if (isCacheableLocalUrl(rawUrl)) {
      urls.add(toAbsoluteUrl(rawUrl))
    }
    match = pattern.exec(html)
  }

  return Array.from(urls)
}

const cacheIfSuccessful = async (cache, request, response) => {
  if (response && response.ok) {
    await cache.put(request, response.clone())
  }
}

const fetchAndCache = async (cache, request) => {
  try {
    const response = await fetch(request)
    await cacheIfSuccessful(cache, request, response)
    return response
  } catch (_error) {
    return null
  }
}

const extractModuleSpecifiers = (source) => {
  const specifiers = new Set()
  const staticImportPattern =
    /(?:import|export)\s+(?:[^'"`]*?\s+from\s+)?["'`]([^"'`]+)["'`]/g
  const dynamicImportPattern = /import\(\s*["'`]([^"'`]+)["'`]\s*\)/g

  let match = staticImportPattern.exec(source)
  while (match) {
    specifiers.add(match[1])
    match = staticImportPattern.exec(source)
  }

  match = dynamicImportPattern.exec(source)
  while (match) {
    specifiers.add(match[1])
    match = dynamicImportPattern.exec(source)
  }

  return Array.from(specifiers)
}

const normalizeModuleSpecifier = (baseUrl, specifier) => {
  if (!specifier) {
    return null
  }

  if (specifier.startsWith('http://') || specifier.startsWith('https://')) {
    const url = new URL(specifier)
    return url.origin === self.location.origin ? url.toString() : null
  }

  if (specifier.startsWith('/')) {
    return toAbsoluteUrl(specifier)
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return new URL(specifier, baseUrl).toString()
  }

  return null
}

const isNuxtModuleUrl = (urlValue) => {
  const url = new URL(urlValue)
  return url.origin === self.location.origin && url.pathname.startsWith('/_nuxt/')
}

const warmModuleGraph = async (cache, entryUrl, visited) => {
  if (visited.size >= MODULE_GRAPH_LIMIT || visited.has(entryUrl)) {
    return
  }

  visited.add(entryUrl)
  const response = await fetchAndCache(cache, entryUrl)

  if (!response || !response.ok) {
    return
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (
    !contentType.includes('javascript') &&
    !contentType.includes('text/plain') &&
    !contentType.includes('application/json') &&
    !entryUrl.includes('/_nuxt/')
  ) {
    return
  }

  let source
  try {
    source = await response.clone().text()
  } catch (_error) {
    return
  }

  const importUrls = extractModuleSpecifiers(source)
    .map((specifier) => normalizeModuleSpecifier(entryUrl, specifier))
    .filter((urlValue) => Boolean(urlValue))
    .filter((urlValue) => isNuxtModuleUrl(urlValue))

  await Promise.all(importUrls.map((moduleUrl) => warmModuleGraph(cache, moduleUrl, visited)))
}

const warmShellCache = async (cache) => {
  const appShellRequest = toAbsoluteUrl(APP_SHELL_URL)
  const appShellResponse = await fetchAndCache(cache, appShellRequest)

  if (appShellResponse) {
    try {
      const html = await appShellResponse.clone().text()
      const shellAssets = extractShellAssets(html)
      await Promise.all(shellAssets.map((url) => fetchAndCache(cache, url)))
    } catch (_error) {
      // Ignore parse errors and keep install flow running.
    }
  }

  await Promise.all(SHELL_ROUTES.map((route) => fetchAndCache(cache, toAbsoluteUrl(route))))

  const visitedModules = new Set()
  await Promise.all(
    MODULE_GRAPH_ENTRYPOINTS.map((entrypoint) =>
      warmModuleGraph(cache, toAbsoluteUrl(entrypoint), visitedModules)
    )
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => warmShellCache(cache))
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

const offlineFallbackResponse = (contentType = 'text/plain; charset=utf-8') =>
  new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'content-type': contentType }
  })

const cacheMatchByPath = async (cache, request) => {
  const exactMatch = await cache.match(request)
  if (exactMatch) {
    return exactMatch
  }

  const byIgnoreSearch = await cache.match(request, { ignoreSearch: true })
  if (byIgnoreSearch) {
    return byIgnoreSearch
  }

  const url = new URL(request.url)
  const normalizedPathMatch = await cache.match(toAbsoluteUrl(url.pathname))
  if (normalizedPathMatch) {
    return normalizedPathMatch
  }

  return null
}

async function networkFirstAsset(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    await cacheIfSuccessful(cache, request, response)
    return response
  } catch (_error) {
    const cached = await cacheMatchByPath(cache, request)
    if (cached) {
      return cached
    }

    if (request.destination === 'script') {
      return offlineFallbackResponse('application/javascript; charset=utf-8')
    }

    if (request.destination === 'style') {
      return offlineFallbackResponse('text/css; charset=utf-8')
    }

    return offlineFallbackResponse()
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    await cacheIfSuccessful(cache, request, response)
    return response
  } catch (_error) {
    const cachedRoute = await cacheMatchByPath(cache, request)
    if (cachedRoute) {
      return cachedRoute
    }

    const appShell = await cache.match(toAbsoluteUrl(APP_SHELL_URL))
    if (appShell) {
      return appShell
    }

    return offlineFallbackResponse('text/html; charset=utf-8')
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
    request.destination === 'manifest' ||
    url.pathname.startsWith('/_nuxt/')

  if (isStaticAsset) {
    event.respondWith(networkFirstAsset(request))
  }
})
