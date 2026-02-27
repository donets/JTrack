import { computed } from 'vue'
import {
  roleKeys,
  rolePrivileges,
  type PrivilegeKey,
  type RoleKey
} from '@jtrack/shared'

const roleKeySet = new Set<string>(roleKeys)

const isRoleKey = (role: string): role is RoleKey => roleKeySet.has(role)

export function useRbacGuard() {
  const authStore = useAuthStore()
  const locationStore = useLocationStore()

  const activeRole = computed<RoleKey | null>(() => {
    if (authStore.user?.isAdmin) {
      return 'Owner'
    }

    const membershipRole = locationStore.activeLocation?.role
    if (!membershipRole || !isRoleKey(membershipRole)) {
      return null
    }

    return membershipRole
  })

  const privileges = computed<PrivilegeKey[]>(() => {
    if (!activeRole.value) {
      return []
    }

    return rolePrivileges[activeRole.value]
  })

  const hasPrivilege = (key: PrivilegeKey) => privileges.value.includes(key)

  const hasAnyPrivilege = (keys: PrivilegeKey[]) => keys.some((key) => hasPrivilege(key))

  return {
    activeRole,
    privileges,
    hasPrivilege,
    hasAnyPrivilege
  }
}
