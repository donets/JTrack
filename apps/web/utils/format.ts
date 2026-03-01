export const formatTicketNumber = (
  ticketNumber: number | null | undefined,
  ticketId?: string
) => {
  if (typeof ticketNumber === 'number' && Number.isFinite(ticketNumber) && ticketNumber > 0) {
    return `#${ticketNumber}`
  }

  if (ticketId) {
    return `#${ticketId.slice(0, 8).toUpperCase()}`
  }

  return '#—'
}

export const formatTicketCode = (ticketId: string) => formatTicketNumber(undefined, ticketId)

export const formatPriorityLabel = (priority: string | null | undefined) => {
  const normalized = priority?.trim().toLowerCase()

  if (!normalized) {
    return 'None'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export const formatMoney = (amountCents: number | null | undefined, currency: string | undefined) => {
  if (amountCents === null || amountCents === undefined) {
    return '—'
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountCents / 100)
}

export const parseAmountToCents = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.')

  if (!normalized) {
    return null
  }

  const amount = Number.parseFloat(normalized)

  if (!Number.isFinite(amount) || amount < 0) {
    return Number.NaN
  }

  return Math.round(amount * 100)
}

export const formatAmountInput = (amountCents: number | null | undefined) => {
  if (amountCents === null || amountCents === undefined) {
    return ''
  }

  return (amountCents / 100).toFixed(2)
}
