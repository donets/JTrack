import type { RoleKey } from './rbac.js'
import type { TicketStatus } from './schemas.js'

const TECHNICIAN_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  New: ['InProgress'],
  Scheduled: ['InProgress'],
  InProgress: ['Done'],
  Done: [],
  Invoiced: [],
  Paid: [],
  Canceled: []
}

const ALL_STATUSES: TicketStatus[] = [
  'New',
  'Scheduled',
  'InProgress',
  'Done',
  'Invoiced',
  'Paid',
  'Canceled'
]

const isSystemOnlyTransition = (current: TicketStatus, next: TicketStatus) =>
  (current === 'Done' && next === 'Invoiced') ||
  (current === 'Invoiced' && next === 'Paid')

const canCancelFromStatus = (current: TicketStatus) => current !== 'Paid'

const roleAllowsTransition = (current: TicketStatus, next: TicketStatus, role: RoleKey) => {
  if (role === 'Technician') {
    return (TECHNICIAN_TRANSITIONS[current] ?? []).includes(next)
  }

  if (role === 'Manager') {
    return next !== 'Paid'
  }

  return true
}

export type TicketStatusTransitionValidation = {
  valid: boolean
  reason?: string
}

export type ValidateStatusTransitionOptions = {
  system?: boolean
}

export const validateStatusTransition = (
  current: TicketStatus,
  next: TicketStatus,
  role: RoleKey,
  options: ValidateStatusTransitionOptions = {}
): TicketStatusTransitionValidation => {
  if (current === next) {
    return { valid: true }
  }

  if (isSystemOnlyTransition(current, next)) {
    if (options.system) {
      return { valid: true }
    }

    return {
      valid: false,
      reason: 'This transition is reserved for system payment workflow'
    }
  }

  if (next === 'Canceled') {
    if (canCancelFromStatus(current)) {
      return { valid: true }
    }

    return {
      valid: false,
      reason: 'Paid tickets cannot be canceled'
    }
  }

  if (!roleAllowsTransition(current, next, role)) {
    return {
      valid: false,
      reason: `Role ${role} cannot transition from ${current} to ${next}`
    }
  }

  return { valid: true }
}

export const listAllowedStatusTransitions = (
  current: TicketStatus,
  role: RoleKey,
  options: ValidateStatusTransitionOptions = {}
) =>
  ALL_STATUSES.filter((next) => validateStatusTransition(current, next, role, options).valid && next !== current)
