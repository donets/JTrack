export const useDispatchAccessGuard = () => {
  const { hasPrivilege } = useRbacGuard()
  const { show } = useToast()

  const canManageDispatch = computed(() => hasPrivilege('dispatch.manage'))

  const enforceDispatchAccess = async () => {
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
