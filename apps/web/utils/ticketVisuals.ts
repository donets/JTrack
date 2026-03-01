import type { BadgeVariant } from '~/types/ui'
import { formatTicketNumber } from './format'

export const statusToBadgeVariant = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    New: 'sky',
    Scheduled: 'violet',
    InProgress: 'flame',
    Done: 'mint',
    Invoiced: 'sky',
    Paid: 'mint',
    Canceled: 'mist'
  }

  return map[status] ?? 'mist'
}

export const priorityToBadgeVariant = (priority: string | null | undefined): BadgeVariant => {
  if (!priority) {
    return 'mist'
  }

  const map: Record<string, BadgeVariant> = {
    high: 'rose',
    medium: 'flame',
    low: 'mist'
  }

  return map[priority.toLowerCase()] ?? 'mist'
}

export const formatTicketCode = (ticketId: string, ticketNumber?: number | null) =>
  formatTicketNumber(ticketNumber, ticketId)

export const shouldShowTicketCode = (showTicketCode?: boolean) => Boolean(showTicketCode)
