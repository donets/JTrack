let syncInterval: ReturnType<typeof setInterval> | null = null

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const locationStore = useLocationStore()
  const syncStore = useSyncStore()

  const runInitialSync = async () => {
    await authStore.bootstrap()

    if (authStore.isAuthenticated) {
      locationStore.restoreActiveLocation()
      locationStore.restoreCachedMemberships()

      try {
        await locationStore.loadLocations()
      } catch (error) {
        console.warn('[sync] failed to load locations during plugin bootstrap', error)
        return
      }
    }

    if (authStore.isAuthenticated && locationStore.activeLocationId) {
      await syncStore.syncNow()
    }
  }

  // Keep plugin startup non-blocking so layout shell renders immediately.
  void runInitialSync()

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
