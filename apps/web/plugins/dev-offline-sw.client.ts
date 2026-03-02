import { preloadRouteComponents } from '#app'

const DEV_OFFLINE_SW_PATH = '/dev-offline-sw.js'
const DEV_OFFLINE_SW_VERSION = 'v4'
const DEV_OFFLINE_SW_URL = `${DEV_OFFLINE_SW_PATH}?${DEV_OFFLINE_SW_VERSION}`
const DEV_OFFLINE_SW_CONTROL_RELOAD_KEY = 'jtrack.devOfflineSw.controlReloaded'
const DEV_OFFLINE_PREWARM_ROUTES = ['/login', '/dashboard', '/tickets', '/locations', '/dispatch']
const DEV_OFFLINE_PREWARM_MODULES = [
  '/_nuxt/layouts/default.vue',
  '/_nuxt/layouts/auth.vue',
  '/_nuxt/pages/login.vue',
  '/_nuxt/pages/dashboard.vue',
  '/_nuxt/pages/tickets/index.vue'
]

const prewarmOfflineCache = async () => {
  if (!navigator.onLine) {
    return
  }

  await Promise.all(
    DEV_OFFLINE_PREWARM_ROUTES.map((route) =>
      fetch(route, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'reload'
      }).catch(() => null)
    )
  )

  await Promise.all(
    DEV_OFFLINE_PREWARM_MODULES.map((modulePath) =>
      fetch(modulePath, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'reload'
      }).catch(() => null)
    )
  )

  await Promise.all(DEV_OFFLINE_PREWARM_ROUTES.map((route) => preloadRouteComponents(route).catch(() => null)))
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client || !import.meta.dev) {
    return
  }

  const runtimeConfig = useRuntimeConfig()
  if (!runtimeConfig.public.enableDevOffline) {
    return
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  void navigator.serviceWorker
    .getRegistrations()
    .then(async (registrations) => {
      await Promise.all(
        registrations.map(async (registration) => {
          const scriptUrl =
            registration.active?.scriptURL ??
            registration.waiting?.scriptURL ??
            registration.installing?.scriptURL ??
            ''

          const scriptPath = scriptUrl ? new URL(scriptUrl).pathname : ''
          if (scriptPath !== DEV_OFFLINE_SW_PATH) {
            await registration.unregister()
          }
        })
      )

      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(
          keys
            .filter((key) => !key.startsWith('jtrack-dev-offline-'))
            .map((key) => caches.delete(key))
        )
      }

      await navigator.serviceWorker.register(DEV_OFFLINE_SW_URL, {
        scope: '/',
        updateViaCache: 'none'
      })
      await navigator.serviceWorker.ready

      if (!navigator.serviceWorker.controller) {
        if (!sessionStorage.getItem(DEV_OFFLINE_SW_CONTROL_RELOAD_KEY)) {
          sessionStorage.setItem(DEV_OFFLINE_SW_CONTROL_RELOAD_KEY, 'true')
          location.reload()
        }
        return
      }

      sessionStorage.removeItem(DEV_OFFLINE_SW_CONTROL_RELOAD_KEY)
      await prewarmOfflineCache()
    })
    .catch((error: unknown) => {
      console.error('Failed to register dev offline service worker', error)
    })
})
