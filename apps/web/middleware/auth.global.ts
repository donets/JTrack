import { isPublicRoute } from '~/utils/public-routes'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const locationStore = useLocationStore()

  if (!authStore.bootstrapped) {
    await authStore.bootstrap()
  }

  if (isPublicRoute(to.path)) {
    if (authStore.isAuthenticated && to.path === '/login') {
      return navigateTo('/dashboard')
    }

    return
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
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
