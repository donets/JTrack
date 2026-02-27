import { ref } from 'vue'

export const useTeamAccessGuard = () => {
  const locationStore = useLocationStore()
  const { hasPrivilege } = useRbacGuard()
  const { show } = useToast()
  const accessRedirected = ref(false)

  const enforceReadAccess = async () => {
    if (!locationStore.activeLocationId) {
      return false
    }

    if (hasPrivilege('users.read')) {
      return true
    }

    if (accessRedirected.value) {
      return false
    }

    accessRedirected.value = true
    show({
      type: 'warning',
      message: 'You do not have permission to view team pages'
    })

    await navigateTo('/dashboard')
    return false
  }

  return {
    enforceReadAccess
  }
}
