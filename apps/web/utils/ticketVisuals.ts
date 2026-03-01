import type { BadgeVariant } from '~/types/ui'

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

export const formatTicketCode = (ticketId: string) => `#${ticketId.slice(0, 8).toUpperCase()}`

export const shouldShowTicketCode = (showTicketCode?: boolean) => Boolean(showTicketCode)
