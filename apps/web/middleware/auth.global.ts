import { isPublicRoute } from '~/utils/public-routes'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const locationStore = useLocationStore()

  const resolveLoginRedirectTarget = () => {
    const redirectParam = to.query.redirect
    const redirectRaw = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam

    if (!redirectRaw || typeof redirectRaw !== 'string') {
      return '/dashboard'
    }

    if (!redirectRaw.startsWith('/') || redirectRaw === '/login' || redirectRaw.startsWith('/login?')) {
      return '/dashboard'
    }

    return redirectRaw
  }

  if (!authStore.bootstrapped) {
    await authStore.bootstrap()
  }

  if (isPublicRoute(to.path)) {
    if (authStore.isAuthenticated && to.path === '/login') {
      return navigateTo(resolveLoginRedirectTarget())
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

    try {
      await locationStore.loadLocations()
    } catch (error) {
      console.warn('[auth] failed to load locations in route middleware', error)
      authStore.clearState()
      locationStore.clear()

      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  }

  const locationOptionalRoute = to.path === '/locations'

  if (!locationOptionalRoute && !locationStore.activeLocationId) {
    return navigateTo('/locations')
  }
})
