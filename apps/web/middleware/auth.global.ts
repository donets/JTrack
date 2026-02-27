export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const locationStore = useLocationStore()

  if (!authStore.bootstrapped) {
    await authStore.bootstrap()
  }

  if (to.path === '/login') {
    if (authStore.isAuthenticated) {
      return navigateTo('/dashboard')
    }

    return
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  if (!locationStore.loaded) {
    locationStore.restoreActiveLocation()
    await locationStore.loadLocations()
  }

  const locationOptionalRoute = to.path === '/locations'

  if (!locationOptionalRoute && !locationStore.activeLocationId) {
    return navigateTo('/locations')
  }
})
