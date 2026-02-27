const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const locationStore = useLocationStore()

  if (!authStore.bootstrapped) {
    await authStore.bootstrap()
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => to.path === route)

  if (isPublicRoute) {
    if (authStore.isAuthenticated && to.path === '/login') {
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
