import { computed } from 'vue'

export const useDispatchAccessGuard = () => {
  const authStore = useAuthStore()
  const locationStore = useLocationStore()
  const { hasPrivilege } = useRbacGuard()
  const { show } = useToast()

  const canManageDispatch = computed(() => hasPrivilege('dispatch.manage'))

  const isClientOffline = () => import.meta.client && navigator.onLine === false

  const ensureAuthSnapshot = () => {
    if (!authStore.user) {
      authStore.restoreState()
    }
  }

  const shouldRestoreOfflineLocationContext = () =>
    isClientOffline() || authStore.offlineSession || Boolean(authStore.user && !authStore.isAuthenticated)

  const hydrateLocationContext = async () => {
    ensureAuthSnapshot()

    if (!locationStore.activeLocationId) {
      locationStore.restoreActiveLocation()
    }

    if (!locationStore.loaded && shouldRestoreOfflineLocationContext()) {
      locationStore.restoreCachedMemberships()
    }

    if (!locationStore.loaded && authStore.isAuthenticated && !isClientOffline()) {
      try {
        await locationStore.loadLocations()
      } catch {
        // Route middleware handles online location bootstrap errors.
      }
    }
  }

  const enforceDispatchAccess = async () => {
    ensureAuthSnapshot()

    if (canManageDispatch.value) {
      return true
    }

    await hydrateLocationContext()

    if (canManageDispatch.value) {
      return true
    }

    show({
      type: 'warning',
      message: 'You do not have permission to access Dispatch.'
    })

    await navigateTo('/dashboard')
    return false
  }

  return {
    canManageDispatch,
    enforceDispatchAccess
  }
}
