let syncInterval: ReturnType<typeof setInterval> | null = null

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const locationStore = useLocationStore()
  const syncStore = useSyncStore()

  await authStore.bootstrap()

  if (authStore.isAuthenticated) {
    locationStore.restoreActiveLocation()
    await locationStore.loadLocations()
  }

  if (authStore.isAuthenticated && locationStore.activeLocationId) {
    await syncStore.syncNow()
  }

  if (!syncInterval) {
    syncInterval = setInterval(() => {
      if (!authStore.isAuthenticated || !locationStore.activeLocationId) {
        return
      }

      void syncStore.syncNow()
    }, 60_000)
  }

  if (import.meta.client) {
    window.addEventListener('online', () => {
      void syncStore.syncNow()
    })
  }
})
