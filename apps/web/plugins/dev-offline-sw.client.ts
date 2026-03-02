const DEV_OFFLINE_SW_PATH = '/dev-offline-sw.js'
const DEV_OFFLINE_SW_CONTROL_RELOAD_KEY = 'jtrack.devOfflineSw.controlReloaded'

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

          if (!scriptUrl.endsWith(DEV_OFFLINE_SW_PATH)) {
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

      await navigator.serviceWorker.register(DEV_OFFLINE_SW_PATH, {
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
    })
    .catch((error: unknown) => {
      console.error('Failed to register dev offline service worker', error)
    })
})
