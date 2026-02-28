import type { RoleKey, UserLocationStatus } from '@jtrack/shared'

export const formatMembershipStatus = (status: UserLocationStatus) => {
  if (status === 'active') {
    return 'Active'
  }

  if (status === 'invited') {
    return 'Invited'
  }

  return 'Suspended'
}

export const roleBadgeVariant = (role: RoleKey) => {
  if (role === 'Owner') {
    return 'flame'
  }

  if (role === 'Manager') {
    return 'sky'
  }

  return 'mint'
}

export const membershipStatusBadgeVariant = (status: UserLocationStatus) => {
  if (status === 'active') {
    return 'mint'
  }

  if (status === 'invited') {
    return 'sky'
  }

  return 'flame'
}
