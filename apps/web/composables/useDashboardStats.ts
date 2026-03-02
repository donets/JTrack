import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { PaymentRecord, Ticket, TicketComment, TicketStatus } from '@jtrack/shared'
import type { TimelineItem } from '~/types/ui'
import {
  priorityToBadgeVariant,
  statusToBadgeVariant,
  statusToLabel,
  type BadgeVariant
} from '~/utils/ticket-status'
import { formatTicketNumber } from '~/utils/format'

interface LocationUser {
  id: string
  name: string
  role: string
  membershipStatus: string
}

type RxDoc<T> = {
  toJSON: () => T
}

type RxSubscription = {
  unsubscribe: () => void
}

export interface DashboardStatusSlice {
  key: 'New' | 'Scheduled' | 'InProgress' | 'Done'
  label: string
  count: number
  variant: BadgeVariant
}

export interface DashboardUnassignedTicket {
  id: string
  title: string
  priorityLabel: string
  priorityVariant: BadgeVariant
  createdAt: string
  createdLabel: string
}

export interface DashboardTeamAvailability {
  userId: string
  name: string
  jobsToday: number
  detail: string
  statusLabel: 'Busy' | 'Available'
  statusVariant: BadgeVariant
}

export interface DashboardScheduleTicket {
  id: string
  title: string
  status: TicketStatus
  statusLabel: string
  statusVariant: BadgeVariant
  timeLabel: string
  locationLabel: string
  description: string | null
  scheduledStartAt: string | null
  scheduledEndAt: string | null
}

export interface DashboardOwnerManagerStats {
  openJobs: number
  dueToday: number
  dueTodayUnassigned: number
  completedMtd: number
  revenueMtdCents: number
  revenueMtdLabel: string
  statusDistribution: DashboardStatusSlice[]
  unassignedTickets: DashboardUnassignedTicket[]
  teamAvailability: DashboardTeamAvailability[]
  activityItems: TimelineItem[]
}

export interface DashboardTechnicianStats {
  jobsToday: number
  completed: number
  remaining: number
  nextJob: DashboardScheduleTicket | null
  schedule: DashboardScheduleTicket[]
}

const OPEN_TICKET_STATUSES = new Set<TicketStatus>(['New', 'Scheduled', 'InProgress'])
const COMPLETED_TICKET_STATUSES = new Set<TicketStatus>(['Done', 'Invoiced', 'Paid'])

const toTimestamp = (value: string | null | undefined) => {
  if (!value) {
    return null
  }

  const time = new Date(value).getTime()
  if (Number.isNaN(time)) {
    return null
  }

  return time
}

const inRange = (
  value: string | null | undefined,
  range: {
    startMs: number
    endMs: number
  }
) => {
  const timestamp = toTimestamp(value)
  if (timestamp === null) {
    return false
  }

  return timestamp >= range.startMs && timestamp < range.endMs
}

const formatPriority = (priority: string | null) => {
  if (!priority) {
    return 'Normal'
  }

  const normalized = priority.trim()
  if (!normalized) {
    return 'Normal'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

const formatTicketLabel = (ticket: { id: string; title: string; ticketNumber?: number }) =>
  `${formatTicketNumber(ticket.ticketNumber, ticket.id)} ${ticket.title}`

const formatRelativeTime = (value: string, nowMs: number) => {
  const timestamp = toTimestamp(value)
  if (timestamp === null) {
    return 'Unknown'
  }

  const diffMs = Math.max(0, nowMs - timestamp)
  const minuteMs = 60_000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.round(diffMs / minuteMs))
    return `${minutes}m ago`
  }

  if (diffMs < dayMs) {
    const hours = Math.round(diffMs / hourMs)
    return `${hours}h ago`
  }

  const days = Math.round(diffMs / dayMs)
  return `${days}d ago`
}

const formatTime = (value: string | null) => {
  if (!value) {
    return 'Unscheduled'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unscheduled'
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatCurrency = (amountCents: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0
  }).format(amountCents / 100)

const providerLabel = (provider: string) => {
  if (provider === 'stripe') {
    return 'Stripe'
  }

  if (provider === 'manual') {
    return 'Manual'
  }

  return provider
}

const toMonthRange = (nowMs: number) => {
  const start = new Date(nowMs)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)

  return {
    startMs: start.getTime(),
    endMs: end.getTime()
  }
}

const toTodayRange = (nowMs: number) => {
  const start = new Date(nowMs)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    startMs: start.getTime(),
    endMs: end.getTime()
  }
}

export const useDashboardStats = () => {
  const authStore = useAuthStore()
  const locationStore = useLocationStore()
  const { hasPrivilege } = useRbacGuard()
  const api = useApiClient()
  const db = useRxdb()

  const tickets = ref<Ticket[]>([])
  const comments = ref<TicketComment[]>([])
  const payments = ref<PaymentRecord[]>([])
  const teamMembers = ref<LocationUser[]>([])
  const usersLoading = ref(false)
  const now = ref(Date.now())

  let clockTimer: ReturnType<typeof setInterval> | null = null
  let ticketSubscription: RxSubscription | null = null
  let commentSubscription: RxSubscription | null = null
  let paymentSubscription: RxSubscription | null = null

  const canReadUsers = computed(() => hasPrivilege('users.read'))

  const todayRange = computed(() => toTodayRange(now.value))
  const monthRange = computed(() => toMonthRange(now.value))

  const todayLabel = computed(() =>
    new Date(now.value).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  )

  const activeTickets = computed(() => tickets.value.filter((ticket) => !ticket.deletedAt))
  const activeComments = computed(() => comments.value.filter((comment) => !comment.deletedAt))

  const teamById = computed(() => {
    const map = new Map<string, LocationUser>()
    for (const member of teamMembers.value) {
      map.set(member.id, member)
    }
    return map
  })

  const resolveUserName = (userId: string | null | undefined) => {
    if (!userId) {
      return 'System'
    }

    const member = teamById.value.get(userId)
    if (member?.name) {
      return member.name
    }

    return `User ${userId.slice(0, 6)}`
  }

  const unsubscribeCollections = () => {
    ticketSubscription?.unsubscribe()
    commentSubscription?.unsubscribe()
    paymentSubscription?.unsubscribe()

    ticketSubscription = null
    commentSubscription = null
    paymentSubscription = null
  }

  const clearLocalData = () => {
    tickets.value = []
    comments.value = []
    payments.value = []
  }

  const subscribeCollections = () => {
    unsubscribeCollections()
    clearLocalData()

    if (!locationStore.activeLocationId) {
      return
    }

    const selector = {
      locationId: locationStore.activeLocationId
    }

    ticketSubscription = db.collections.tickets
      .find({ selector })
      .$
      .subscribe((docs: RxDoc<Ticket>[]) => {
        tickets.value = docs.map((doc) => doc.toJSON())
      })

    commentSubscription = db.collections.ticketComments
      .find({ selector })
      .$
      .subscribe((docs: RxDoc<TicketComment>[]) => {
        comments.value = docs.map((doc) => doc.toJSON())
      })

    paymentSubscription = db.collections.paymentRecords
      .find({ selector })
      .$
      .subscribe((docs: RxDoc<PaymentRecord>[]) => {
        payments.value = docs.map((doc) => doc.toJSON())
      })
  }

  const loadTeamMembers = async () => {
    if (!locationStore.activeLocationId || !canReadUsers.value) {
      teamMembers.value = []
      return
    }

    usersLoading.value = true

    try {
      teamMembers.value = await api.get<LocationUser[]>('/users')
    } catch {
      teamMembers.value = []
    } finally {
      usersLoading.value = false
    }
  }

  watch(() => locationStore.activeLocationId, subscribeCollections, { immediate: true })
  watch([() => locationStore.activeLocationId, canReadUsers], () => {
    void loadTeamMembers()
  }, { immediate: true })

  onMounted(() => {
    clockTimer = setInterval(() => {
      now.value = Date.now()
    }, 60_000)
  })

  onUnmounted(() => {
    if (clockTimer) {
      clearInterval(clockTimer)
      clockTimer = null
    }

    unsubscribeCollections()
  })

  const ownerManager = computed<DashboardOwnerManagerStats>(() => {
    const openTickets = activeTickets.value.filter((ticket) => OPEN_TICKET_STATUSES.has(ticket.status))
    const dueTodayTickets = openTickets.filter((ticket) => inRange(ticket.scheduledStartAt, todayRange.value))

    const completedMtd = activeTickets.value.filter(
      (ticket) =>
        COMPLETED_TICKET_STATUSES.has(ticket.status) &&
        inRange(ticket.updatedAt, monthRange.value)
    ).length

    const successfulPayments = payments.value.filter(
      (payment) =>
        payment.status === 'Succeeded' &&
        inRange(payment.createdAt, monthRange.value)
    )

    const revenueMtdCents = successfulPayments.reduce((sum, payment) => sum + payment.amountCents, 0)
    const revenueCurrency = successfulPayments[0]?.currency ?? 'EUR'

    const statusDistribution: DashboardStatusSlice[] = [
      {
        key: 'New',
        label: 'New',
        count: activeTickets.value.filter((ticket) => ticket.status === 'New').length,
        variant: statusToBadgeVariant('New')
      },
      {
        key: 'Scheduled',
        label: 'Scheduled',
        count: activeTickets.value.filter((ticket) => ticket.status === 'Scheduled').length,
        variant: statusToBadgeVariant('Scheduled')
      },
      {
        key: 'InProgress',
        label: 'In Progress',
        count: activeTickets.value.filter((ticket) => ticket.status === 'InProgress').length,
        variant: statusToBadgeVariant('InProgress')
      },
      {
        key: 'Done',
        label: 'Done',
        count: activeTickets.value.filter((ticket) => COMPLETED_TICKET_STATUSES.has(ticket.status)).length,
        variant: 'mint'
      }
    ]

    const unassignedTickets = openTickets
      .filter((ticket) => !ticket.assignedToUserId)
      .sort((left, right) => {
        const leftTime = toTimestamp(left.createdAt) ?? 0
        const rightTime = toTimestamp(right.createdAt) ?? 0
        return rightTime - leftTime
      })
      .slice(0, 6)
      .map<DashboardUnassignedTicket>((ticket) => ({
        id: ticket.id,
        title: formatTicketLabel(ticket),
        priorityLabel: formatPriority(ticket.priority),
        priorityVariant: priorityToBadgeVariant(ticket.priority),
        createdAt: ticket.createdAt,
        createdLabel: formatRelativeTime(ticket.createdAt, now.value)
      }))

    const todaysTicketsByUser = new Map<string, Ticket[]>()
    for (const ticket of activeTickets.value) {
      if (!ticket.assignedToUserId || !inRange(ticket.scheduledStartAt, todayRange.value)) {
        continue
      }

      const existing = todaysTicketsByUser.get(ticket.assignedToUserId) ?? []
      existing.push(ticket)
      todaysTicketsByUser.set(ticket.assignedToUserId, existing)
    }

    const teamUserIds = new Set<string>()
    for (const member of teamMembers.value) {
      if (member.role === 'Technician' && member.membershipStatus === 'active') {
        teamUserIds.add(member.id)
      }
    }
    for (const userId of todaysTicketsByUser.keys()) {
      teamUserIds.add(userId)
    }

    const teamAvailability = [...teamUserIds]
      .map<DashboardTeamAvailability>((userId) => {
        const name = resolveUserName(userId)
        const jobs = (todaysTicketsByUser.get(userId) ?? []).sort((left, right) => {
          const leftTime = toTimestamp(left.scheduledStartAt) ?? Number.MAX_SAFE_INTEGER
          const rightTime = toTimestamp(right.scheduledStartAt) ?? Number.MAX_SAFE_INTEGER
          return leftTime - rightTime
        })

        const nextOpenJob = jobs.find((ticket) => {
          if (!OPEN_TICKET_STATUSES.has(ticket.status)) {
            return false
          }

          const startAt = toTimestamp(ticket.scheduledStartAt)
          return startAt === null || startAt >= now.value
        })

        const hasInProgress = jobs.some((ticket) => ticket.status === 'InProgress')
        const busy = hasInProgress || jobs.length > 0
        const nextJobText = nextOpenJob?.scheduledStartAt ? formatTime(nextOpenJob.scheduledStartAt) : 'Free now'

        return {
          userId,
          name,
          jobsToday: jobs.length,
          detail: jobs.length === 0 ? 'No jobs today' : `${jobs.length} jobs • Next: ${nextJobText}`,
          statusLabel: busy ? 'Busy' : 'Available',
          statusVariant: busy ? 'flame' : 'mint'
        }
      })
      .sort((left, right) => {
        if (left.statusLabel !== right.statusLabel) {
          return left.statusLabel === 'Busy' ? -1 : 1
        }

        if (left.jobsToday !== right.jobsToday) {
          return right.jobsToday - left.jobsToday
        }

        return left.name.localeCompare(right.name)
      })

    const ticketTitleById = new Map<string, string>()
    for (const ticket of activeTickets.value) {
      ticketTitleById.set(ticket.id, formatTicketLabel(ticket))
    }

    const activityItems: TimelineItem[] = []

    for (const ticket of activeTickets.value) {
      activityItems.push({
        id: `ticket-created-${ticket.id}`,
        type: 'status_change',
        actor: {
          name: resolveUserName(ticket.createdByUserId)
        },
        content: `${formatTicketLabel(ticket)} created`,
        timestamp: ticket.createdAt
      })

      if (ticket.updatedAt !== ticket.createdAt) {
        activityItems.push({
          id: `ticket-updated-${ticket.id}`,
          type: 'status_change',
          actor: {
            name: 'System'
          },
          content: `${formatTicketLabel(ticket)} moved to ${statusToLabel(ticket.status)}`,
          timestamp: ticket.updatedAt
        })
      }
    }

    for (const comment of activeComments.value) {
      activityItems.push({
        id: `comment-${comment.id}`,
        type: 'comment',
        actor: {
          name: resolveUserName(comment.authorUserId)
        },
        content: `Comment on ${ticketTitleById.get(comment.ticketId) ?? 'ticket'}: ${comment.body.slice(0, 80)}`,
        timestamp: comment.createdAt
      })
    }

    for (const payment of payments.value) {
      const ticketTitle = ticketTitleById.get(payment.ticketId) ?? 'ticket'
      activityItems.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        actor: {
          name: providerLabel(payment.provider)
        },
        content: `${formatCurrency(payment.amountCents, payment.currency)} received for ${ticketTitle}`,
        timestamp: payment.createdAt
      })
    }

    activityItems.sort((left, right) => {
      const leftTime = toTimestamp(left.timestamp) ?? 0
      const rightTime = toTimestamp(right.timestamp) ?? 0
      return rightTime - leftTime
    })

    return {
      openJobs: openTickets.length,
      dueToday: dueTodayTickets.length,
      dueTodayUnassigned: dueTodayTickets.filter((ticket) => !ticket.assignedToUserId).length,
      completedMtd,
      revenueMtdCents,
      revenueMtdLabel: formatCurrency(revenueMtdCents, revenueCurrency),
      statusDistribution,
      unassignedTickets,
      teamAvailability,
      activityItems: activityItems.slice(0, 8)
    }
  })

  const technician = computed<DashboardTechnicianStats>(() => {
    const userId = authStore.user?.id
    if (!userId) {
      return {
        jobsToday: 0,
        completed: 0,
        remaining: 0,
        nextJob: null,
        schedule: []
      }
    }

    const locationLabel = locationStore.activeLocation?.name ?? 'Current location'

    const schedule = activeTickets.value
      .filter(
        (ticket) =>
          ticket.assignedToUserId === userId &&
          inRange(ticket.scheduledStartAt, todayRange.value)
      )
      .sort((left, right) => {
        const leftTime = toTimestamp(left.scheduledStartAt) ?? Number.MAX_SAFE_INTEGER
        const rightTime = toTimestamp(right.scheduledStartAt) ?? Number.MAX_SAFE_INTEGER
        return leftTime - rightTime
      })
      .map<DashboardScheduleTicket>((ticket) => ({
        id: ticket.id,
        title: formatTicketLabel(ticket),
        status: ticket.status,
        statusLabel: statusToLabel(ticket.status),
        statusVariant: statusToBadgeVariant(ticket.status),
        timeLabel:
          ticket.scheduledStartAt && ticket.scheduledEndAt
            ? `${formatTime(ticket.scheduledStartAt)} - ${formatTime(ticket.scheduledEndAt)}`
            : formatTime(ticket.scheduledStartAt),
        locationLabel,
        description: ticket.description,
        scheduledStartAt: ticket.scheduledStartAt,
        scheduledEndAt: ticket.scheduledEndAt
      }))

    const completed = schedule.filter((ticket) => COMPLETED_TICKET_STATUSES.has(ticket.status)).length
    const remaining = Math.max(0, schedule.length - completed)

    const nextJob =
      schedule.find((ticket) => {
        if (!OPEN_TICKET_STATUSES.has(ticket.status)) {
          return false
        }

        const startAt = toTimestamp(ticket.scheduledStartAt)
        return startAt === null || startAt >= now.value
      }) ??
      schedule.find((ticket) => OPEN_TICKET_STATUSES.has(ticket.status)) ??
      null

    return {
      jobsToday: schedule.length,
      completed,
      remaining,
      nextJob,
      schedule
    }
  })

  return {
    todayLabel,
    usersLoading,
    ownerManager,
    technician
  }
}
