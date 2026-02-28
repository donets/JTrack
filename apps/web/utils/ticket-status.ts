import type { RoleKey, TicketStatus } from '@jtrack/shared'

export type BadgeVariant = 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist'

export const statusToBadgeVariant = (status: TicketStatus): BadgeVariant => {
  if (status === 'New') {
    return 'sky'
  }

  if (status === 'Scheduled') {
    return 'violet'
  }

  if (status === 'InProgress') {
    return 'flame'
  }

  if (status === 'Done' || status === 'Paid') {
    return 'mint'
  }

  if (status === 'Invoiced') {
    return 'sky'
  }

  if (status === 'Canceled') {
    return 'mist'
  }

  return 'mist'
}

export const priorityToBadgeVariant = (priority: string | null | undefined): BadgeVariant => {
  const normalized = priority?.trim().toLowerCase()

  if (normalized === 'high' || normalized === 'urgent') {
    return 'rose'
  }

  if (normalized === 'medium') {
    return 'flame'
  }

  if (normalized === 'low') {
    return 'mist'
  }

  return 'mist'
}

export const roleToBadgeVariant = (role: RoleKey): BadgeVariant => {
  if (role === 'Owner') {
    return 'flame'
  }

  if (role === 'Manager') {
    return 'sky'
  }

  return 'mint'
}

export const statusToLabel = (status: TicketStatus) => {
  if (status === 'InProgress') {
    return 'In Progress'
  }

  return status
}
