export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return
  }

  const runtimeConfig = useRuntimeConfig()
  if (runtimeConfig.public.enableDevOffline) {
    return
  }

  const isLocalRuntime =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '0.0.0.0'

  if (!import.meta.dev && !isLocalRuntime) {
    return
  }

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      void Promise.all(registrations.map((registration) => registration.unregister()))
    })
  }

  if ('caches' in window) {
    void caches.keys().then((keys) => {
      void Promise.all(keys.map((key) => caches.delete(key)))
    })
  }
})
