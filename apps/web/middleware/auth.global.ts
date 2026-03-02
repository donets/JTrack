import { isPublicRoute } from '~/utils/public-routes'

export default defineNuxtRouteMiddleware(async (to) => {
  const runtimeConfig = useRuntimeConfig()
  const authStore = useAuthStore()
  const locationStore = useLocationStore()
  const isClientOffline = () => import.meta.client && navigator.onLine === false
  const isDevOfflineMode = () => runtimeConfig.public.enableDevOffline && isClientOffline()
  const hasOfflineSession = () => isClientOffline() && Boolean(authStore.user)
  const hasRouteAccessSession = () => authStore.isAuthenticated || hasOfflineSession()
  const resolveLoginRedirectTarget = (query: Record<string, unknown>) => {
    const redirectParam = query.redirect
    const redirectRaw = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam

    if (!redirectRaw || typeof redirectRaw !== 'string') {
      return '/dashboard'
    }

    if (!redirectRaw.startsWith('/') || redirectRaw === '/login' || redirectRaw.startsWith('/login?')) {
      return '/dashboard'
    }

    return redirectRaw
  }

  const enforceCurrentRouteAccess = () => {
    if (!import.meta.client) {
      return
    }

    const currentRoute = useRoute()

    if (currentRoute.fullPath !== to.fullPath && !currentRoute.fullPath.startsWith('/login')) {
      return
    }

    if (isPublicRoute(currentRoute.path)) {
      if (hasRouteAccessSession() && currentRoute.path === '/login') {
        void navigateTo(resolveLoginRedirectTarget(currentRoute.query as Record<string, unknown>), {
          replace: true
        })
      }

      return
    }

    if (!hasRouteAccessSession()) {
      void navigateTo(
        {
          path: '/login',
          query: { redirect: currentRoute.fullPath }
        },
        { replace: true }
      )
      return
    }

    const locationOptionalRoute = currentRoute.path === '/locations'
    if (!locationOptionalRoute && locationStore.loaded && !locationStore.activeLocationId) {
      void navigateTo('/locations', { replace: true })
    }
  }

  if (isDevOfflineMode()) {
    if (!authStore.bootstrapped) {
      void authStore.bootstrap()
    }
    locationStore.restoreCachedMemberships()
    if (!locationStore.activeLocationId) {
      locationStore.restoreActiveLocation()
    }
    return
  }

  if (!authStore.bootstrapped) {
    void authStore.bootstrap().finally(() => {
      if (hasRouteAccessSession() && !locationStore.loaded) {
        locationStore.restoreActiveLocation()
        if (hasOfflineSession()) {
          locationStore.restoreCachedMemberships()
        }
        if (hasOfflineSession()) {
          enforceCurrentRouteAccess()
          return
        }

        void locationStore
          .loadLocations()
          .then(() => {
            enforceCurrentRouteAccess()
          })
          .catch((error) => {
            console.warn('[auth] failed to load locations in route middleware bootstrap', error)
            authStore.clearState()
            locationStore.clear()
            enforceCurrentRouteAccess()
          })
        return
      }

      enforceCurrentRouteAccess()
    })
    return
  }

  if (isPublicRoute(to.path)) {
    if (hasRouteAccessSession() && to.path === '/login') {
      return navigateTo(resolveLoginRedirectTarget(to.query as Record<string, unknown>))
    }

    return
  }

  if (!hasRouteAccessSession()) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  if (!locationStore.loaded) {
    locationStore.restoreActiveLocation()
    if (hasOfflineSession()) {
      locationStore.restoreCachedMemberships()
    }
    if (hasOfflineSession()) {
      return
    }

    void locationStore
      .loadLocations()
      .then(() => {
        enforceCurrentRouteAccess()
      })
      .catch((error) => {
        console.warn('[auth] failed to load locations in route middleware', error)
        authStore.clearState()
        locationStore.clear()

        enforceCurrentRouteAccess()
      })
    return
  }

  const locationOptionalRoute = to.path === '/locations'

  if (!locationOptionalRoute && !locationStore.activeLocationId) {
    return navigateTo('/locations')
  }
})
