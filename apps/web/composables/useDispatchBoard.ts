import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import type { RoleKey, Ticket, TicketStatus } from '@jtrack/shared'
import type {
  DispatchGanttRowDropPayload,
  DispatchScheduledJob,
  DispatchTechnician,
  KanbanTicketCardItem,
  QuickAssignPayload,
  QuickAssignTechnicianOption
} from '~/types/ui'

type TeamMemberLike = {
  id: string
  name: string
  role: RoleKey
  membershipStatus: 'active' | 'invited' | 'suspended'
}

type WeeklyTechnicianSchedule = DispatchTechnician & {
  jobsByDay: Record<string, DispatchScheduledJob[]>
}

const INACTIVE_STATUSES: TicketStatus[] = ['Done', 'Invoiced', 'Paid', 'Canceled']

export const useDispatchBoard = (selectedDate: Ref<string>) => {
  const db = useRxdb()
  const locationStore = useLocationStore()
  const repository = useOfflineRepository()
  const syncStore = useSyncStore()
  const teamStore = useTeamStore()

  const tickets = ref<Ticket[]>([])
  let ticketSubscription: { unsubscribe: () => void } | null = null

  const activeTechnicians = computed<TeamMemberLike[]>(() =>
    teamStore.members.filter(
      (member) => member.role === 'Technician' && member.membershipStatus === 'active'
    )
  )

  const unassignedTickets = computed<KanbanTicketCardItem[]>(() =>
    tickets.value
      .filter((ticket) => !ticket.deletedAt)
      .filter((ticket) => !ticket.assignedToUserId)
      .filter((ticket) => !INACTIVE_STATUSES.includes(ticket.status))
      .sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1))
      .map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        assignedToUserId: ticket.assignedToUserId,
        dueAt: ticket.scheduledStartAt,
        scheduledStartAt: ticket.scheduledStartAt,
        scheduledEndAt: ticket.scheduledEndAt,
        updatedAt: ticket.updatedAt
      }))
  )

  const dailyJobsByTechnician = computed(() => {
    const map = new Map<string, DispatchScheduledJob[]>()

    for (const technician of activeTechnicians.value) {
      map.set(technician.id, [])
    }

    for (const ticket of tickets.value) {
      if (ticket.deletedAt || !ticket.assignedToUserId || !ticket.scheduledStartAt) {
        continue
      }

      if (!isSameDate(ticket.scheduledStartAt, selectedDate.value)) {
        continue
      }

      const jobs = map.get(ticket.assignedToUserId)
      if (!jobs) {
        continue
      }

      jobs.push(toScheduledJob(ticket))
    }

    for (const jobs of map.values()) {
      jobs.sort((left, right) => {
        const l = left.scheduledStartAt ?? ''
        const r = right.scheduledStartAt ?? ''
        if (l < r) return -1
        if (l > r) return 1
        return 0
      })
    }

    return map
  })

  const technicians = computed<DispatchTechnician[]>(() =>
    activeTechnicians.value.map((technician) => ({
      id: technician.id,
      name: technician.name,
      avatarName: technician.name,
      role: technician.role,
      jobs: dailyJobsByTechnician.value.get(technician.id) ?? []
    }))
  )

  const weekDates = computed(() => {
    const weekStart = startOfWeek(parseDate(selectedDate.value))
    return Array.from({ length: 7 }, (_, index) => formatDate(addDays(weekStart, index)))
  })

  const weeklySchedules = computed<WeeklyTechnicianSchedule[]>(() => {
    const weekSet = new Set(weekDates.value)

    return activeTechnicians.value.map((technician) => {
      const jobsByDay: Record<string, DispatchScheduledJob[]> = Object.fromEntries(
        weekDates.value.map((date) => [date, [] as DispatchScheduledJob[]])
      )

      for (const ticket of tickets.value) {
        if (ticket.deletedAt || ticket.assignedToUserId !== technician.id || !ticket.scheduledStartAt) {
          continue
        }

        const ticketDay = isoDateUtc(ticket.scheduledStartAt)
        if (!weekSet.has(ticketDay)) {
          continue
        }

        jobsByDay[ticketDay]?.push(toScheduledJob(ticket))
      }

      for (const jobs of Object.values(jobsByDay)) {
        jobs.sort((left, right) => {
          const l = left.scheduledStartAt ?? ''
          const r = right.scheduledStartAt ?? ''
          if (l < r) return -1
          if (l > r) return 1
          return 0
        })
      }

      return {
        id: technician.id,
        name: technician.name,
        avatarName: technician.name,
        role: technician.role,
        jobs: Object.values(jobsByDay).flat(),
        jobsByDay
      }
    })
  })

  const technicianOptions = computed<QuickAssignTechnicianOption[]>(() =>
    activeTechnicians.value.map((technician) => ({
      id: technician.id,
      name: technician.name,
      avatarName: technician.name,
      jobCount: technicians.value.find((item) => item.id === technician.id)?.jobs.length ?? 0
    }))
  )

  const subscribeTickets = () => {
    ticketSubscription?.unsubscribe()

    if (!locationStore.activeLocationId) {
      tickets.value = []
      return
    }

    ticketSubscription = db.collections.tickets
      .find({
        selector: {
          locationId: locationStore.activeLocationId
        }
      })
      .$
      .subscribe((docs: { toJSON: () => Ticket }[]) => {
        tickets.value = docs.map((doc) => doc.toJSON())
      })
  }

  const loadTeam = async () => {
    if (!locationStore.activeLocationId) {
      return
    }

    try {
      await teamStore.fetchMembers()
    } catch {
      // Keep dispatch board usable with cached/offline data even if team API fails.
    }
  }

  const assignDroppedTicket = async (payload: DispatchGanttRowDropPayload) => {
    await repository.saveTicket({
      id: payload.ticketId,
      assignedToUserId: payload.technicianId,
      scheduledStartAt: payload.scheduledStartAt,
      scheduledEndAt: payload.scheduledEndAt,
      status: 'Scheduled'
    })

    await syncStore.syncNow()
  }

  const assignTicket = async (payload: QuickAssignPayload) => {
    await repository.saveTicket({
      id: payload.ticketId,
      assignedToUserId: payload.assignedToUserId,
      scheduledStartAt: payload.scheduledStartAt,
      scheduledEndAt: payload.scheduledEndAt,
      status: 'Scheduled'
    })

    await syncStore.syncNow()
  }

  watch(() => locationStore.activeLocationId, subscribeTickets, { immediate: true })
  watch(() => locationStore.activeLocationId, loadTeam, { immediate: true })

  onUnmounted(() => {
    ticketSubscription?.unsubscribe()
  })

  return {
    tickets,
    technicians,
    unassignedTickets,
    weekDates,
    weeklySchedules,
    technicianOptions,
    assignDroppedTicket,
    assignTicket,
    loadTeam
  }
}

function toScheduledJob(ticket: Ticket): DispatchScheduledJob {
  return {
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    assignedToUserId: ticket.assignedToUserId,
    ticketCode: `#${ticket.id.slice(0, 8).toUpperCase()}`,
    scheduledStartAt: ticket.scheduledStartAt,
    scheduledEndAt: ticket.scheduledEndAt
  }
}

function isSameDate(iso: string, date: string) {
  return isoDateUtc(iso) === date
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (Number.isNaN(parsed.getTime())) {
    return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))
  }

  return parsed
}

function formatDate(date: Date) {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  const day = start.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setUTCDate(start.getUTCDate() + diff)
  start.setUTCHours(0, 0, 0, 0)
  return start
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function isoDateUtc(iso: string) {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }
  return formatDate(parsed)
}
