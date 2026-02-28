<template>
  <section>
    <div class="rounded-xl border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-3 sm:gap-3 sm:px-5">
        <div class="min-w-0 flex-1 sm:max-w-52">
          <JSearchInput v-model="searchQuery" placeholder="Search…" />
        </div>
        <div class="w-28 shrink-0 sm:w-40">
          <JListbox v-model="statusFilter" :options="statusOptions" placeholder="All statuses" />
        </div>
        <div class="w-28 shrink-0 sm:w-40">
          <JListbox v-model="priorityFilter" :options="priorityOptions" placeholder="All priorities" />
        </div>
        <JButton class="shrink-0 !px-3 sm:!px-4" @click="createTicket">
          <span class="sm:hidden">+</span>
          <span class="hidden sm:inline">New Ticket</span>
        </JButton>
      </div>

      <div class="border-b border-slate-100 px-3 sm:px-5">
        <JTabs
          v-model="activeView"
          :tabs="viewTabs"
          id-prefix="tickets-tab"
          panel-id-prefix="tickets-view-panel"
        />
      </div>

      <div
        v-if="activeView === 'all'"
        id="tickets-view-panel-all"
        role="tabpanel"
        aria-labelledby="tickets-tab-all"
      >
        <table class="w-full divide-y divide-slate-200 text-sm sm:text-base">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-3.5 text-left text-sm font-medium text-slate-600 sm:px-5">Title</th>
              <th
                v-for="col in sortableColumns"
                :key="col.key"
                :class="['cursor-pointer select-none px-3 py-3.5 text-left text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:px-5', col.hideClass]"
                @click="toggleSort(col.key)"
              >
                <span class="inline-flex items-center gap-1">
                  {{ col.label }}
                  <svg v-if="sortKey === col.key" class="h-3.5 w-3.5" :class="sortDir === 'desc' ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                  </svg>
                  <span v-else class="h-3.5 w-3.5" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="ticket in visibleTickets"
              :key="ticket.id"
              class="cursor-pointer transition-colors hover:bg-slate-50"
              @click="navigateTo(`/tickets/${ticket.id}`)"
            >
              <td class="px-3 py-4 font-medium text-slate-900 sm:px-5">{{ ticket.title }}</td>
              <td class="px-3 py-4 sm:px-5">
                <JBadge :variant="statusVariant(ticket.status)">{{ ticket.status }}</JBadge>
              </td>
              <td class="px-3 py-4 sm:px-5">
                <JBadge :variant="priorityToBadgeVariant(ticket.priority)">{{ priorityLabel(ticket.priority) }}</JBadge>
              </td>
              <td class="hidden px-5 py-4 text-slate-500 lg:table-cell" :title="formatTooltipDate(ticket.createdAt)">{{ timeAgo(ticket.createdAt) }}</td>
              <td class="hidden px-5 py-4 text-slate-500 lg:table-cell" :title="formatTooltipDate(ticket.updatedAt)">{{ timeAgo(ticket.updatedAt) }}</td>
            </tr>
            <tr v-if="visibleTickets.length === 0">
              <td class="px-3 py-8 text-center text-slate-400 sm:px-5" colspan="5">No tickets found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else
        id="tickets-view-panel-board"
        role="tabpanel"
        aria-labelledby="tickets-tab-board"
        class="px-3 py-3 sm:px-5"
      >
        <div class="overflow-x-auto">
          <div class="flex min-w-max items-start gap-3 pb-1">
            <TicketKanbanColumn
              v-for="column in boardColumns"
              :key="column.status"
              :status="column.status"
              :title="column.label"
              :tickets="kanbanColumns[column.status] ?? []"
              :show-ticket-code="false"
              @ticket-drop="onKanbanDrop"
              @open-ticket="openTicket"
              @quick-assign="openQuickAssign"
            />
          </div>
        </div>
      </div>
    </div>

    <TicketQuickAssignModal
      :model-value="quickAssignOpen"
      :ticket-id="quickAssignTicketId"
      :technicians="technicianOptions"
      :submitting="quickAssignSubmitting"
      @update:model-value="quickAssignOpen = $event"
      @submit="submitQuickAssign"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TicketStatus } from '@jtrack/shared'
import type {
  BreadcrumbItem,
  KanbanColumnDropPayload,
  KanbanColumnItem,
  KanbanTicketCardItem,
  QuickAssignPayload,
  QuickAssignTechnicianOption,
  TabItem
} from '~/types/ui'
import { priorityToBadgeVariant, statusToBadgeVariant } from '~/utils/ticketVisuals'

const route = useRoute()
const router = useRouter()

const locationStore = useLocationStore()
const teamStore = useTeamStore()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const db = useRxdb()
const { setBreadcrumbs } = useBreadcrumbs()
const { show } = useToast()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Tickets', to: '/tickets' }
]

setBreadcrumbs(breadcrumbs)

type TicketListSortKey = 'status' | 'priority' | 'createdAt' | 'updatedAt'
type TicketView = 'all' | 'board'
type QueryView = string | null | (string | null)[] | undefined

type TicketRecord = {
  id: string
  title: string
  description: string | null
  status: TicketStatus
  priority: string | null
  assignedToUserId: string | null
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

const viewTabs: TabItem[] = [
  { key: 'all', label: 'All' },
  { key: 'board', label: 'Board' }
]

const boardColumns: KanbanColumnItem[] = [
  { status: 'New', label: 'New' },
  { status: 'Scheduled', label: 'Scheduled' },
  { status: 'InProgress', label: 'In Progress' },
  { status: 'Done', label: 'Done' },
  { status: 'Invoiced', label: 'Invoiced' },
  { status: 'Paid', label: 'Paid' }
]

const getViewFromQuery = (value: QueryView): TicketView => {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === 'board' ? 'board' : 'all'
}

const tickets = ref<TicketRecord[]>([])
let subscription: { unsubscribe: () => void } | null = null

const statusFilter = ref('')
const priorityFilter = ref('')
const searchQuery = ref('')
const sortKey = ref<TicketListSortKey>('updatedAt')
const sortDir = ref<'asc' | 'desc'>('desc')
const activeView = ref<TicketView>(getViewFromQuery(route.query.view))

const quickAssignOpen = ref(false)
const quickAssignSubmitting = ref(false)
const quickAssignTicketId = ref('')

const sortableColumns = [
  { key: 'status' as const, label: 'Status', hideClass: '' },
  { key: 'priority' as const, label: 'Priority', hideClass: '' },
  { key: 'createdAt' as const, label: 'Created', hideClass: 'hidden lg:table-cell' },
  { key: 'updatedAt' as const, label: 'Updated', hideClass: 'hidden lg:table-cell' }
]

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'New', label: 'New' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'InProgress', label: 'In progress' },
  { value: 'Done', label: 'Done' },
  { value: 'Invoiced', label: 'Invoiced' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Canceled', label: 'Canceled' }
]

const priorityOptions = [
  { value: '', label: 'All priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
]

const statusOrder: Record<string, number> = {
  New: 0,
  Scheduled: 1,
  InProgress: 2,
  Done: 3,
  Invoiced: 4,
  Paid: 5,
  Canceled: 6
}

const priorityOrder: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2
}

const assigneeNames = computed(() => {
  const map = new Map<string, string>()
  for (const member of teamStore.members) {
    map.set(member.id, member.name)
  }
  return map
})

const filteredTickets = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  return tickets.value
    .filter((ticket) => !ticket.deletedAt)
    .filter((ticket) => (statusFilter.value ? ticket.status === statusFilter.value : true))
    .filter((ticket) => {
      if (!priorityFilter.value) {
        return true
      }
      return (ticket.priority ?? '').toLowerCase() === priorityFilter.value
    })
    .filter((ticket) => {
      if (!query) {
        return true
      }

      return (
        ticket.title?.toLowerCase().includes(query)
        || ticket.description?.toLowerCase().includes(query)
      )
    })
})

const visibleTickets = computed(() => [...filteredTickets.value].sort(compareTickets))

const boardTickets = computed<KanbanTicketCardItem[]>(() =>
  filteredTickets.value.map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    assignedToUserId: ticket.assignedToUserId,
    assigneeName: ticket.assignedToUserId
      ? assigneeNames.value.get(ticket.assignedToUserId)
      : undefined,
    dueAt: ticket.scheduledStartAt,
    scheduledStartAt: ticket.scheduledStartAt,
    scheduledEndAt: ticket.scheduledEndAt,
    updatedAt: ticket.updatedAt
  }))
)

const kanbanColumns = computed<Record<string, KanbanTicketCardItem[]>>(() => {
  const grouped: Record<string, KanbanTicketCardItem[]> = Object.fromEntries(
    boardColumns.map((column) => [column.status, [] as KanbanTicketCardItem[]])
  )

  for (const ticket of boardTickets.value) {
    if (grouped[ticket.status]) {
      grouped[ticket.status]?.push(ticket)
    }
  }

  return grouped
})

const technicianOptions = computed<QuickAssignTechnicianOption[]>(() => {
  const jobsByTechnician = new Map<string, number>()

  for (const ticket of tickets.value) {
    if (ticket.deletedAt || !ticket.assignedToUserId) {
      continue
    }

    jobsByTechnician.set(
      ticket.assignedToUserId,
      (jobsByTechnician.get(ticket.assignedToUserId) ?? 0) + 1
    )
  }

  return teamStore.members
    .filter((member) => member.role === 'Technician' && member.membershipStatus === 'active')
    .map((member) => ({
      id: member.id,
      name: member.name,
      jobCount: jobsByTechnician.get(member.id) ?? 0
    }))
})

function toggleSort(key: TicketListSortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'createdAt' || key === 'updatedAt' ? 'desc' : 'asc'
  }
}

function compareTickets(a: TicketRecord, b: TicketRecord): number {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value

  if (key === 'status') {
    return ((statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)) * dir
  }

  if (key === 'priority') {
    const ap = priorityOrder[(a.priority ?? '').toLowerCase()] ?? 99
    const bp = priorityOrder[(b.priority ?? '').toLowerCase()] ?? 99
    return (ap - bp) * dir
  }

  const av = a[key] ?? ''
  const bv = b[key] ?? ''
  if (av < bv) return -1 * dir
  if (av > bv) return 1 * dir
  return 0
}

function statusVariant(status: string) {
  return statusToBadgeVariant(status)
}

function priorityLabel(priority: string | null | undefined) {
  if (!priority) {
    return 'None'
  }

  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

function formatTooltipDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { weekday: 'long' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const date = d.getDate()
  const hour = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${day} ${month} ${date}, ${hour}`
}

const subscribeToTickets = () => {
  subscription?.unsubscribe()

  if (!locationStore.activeLocationId) {
    tickets.value = []
    return
  }

  subscription = db.collections.tickets
    .find({
      selector: {
        locationId: locationStore.activeLocationId
      }
    })
    .$
    .subscribe((docs: { toJSON: () => TicketRecord }[]) => {
      tickets.value = docs.map((doc) => doc.toJSON())
    })
}

const fetchTeamMembers = async () => {
  if (!locationStore.activeLocationId) {
    return
  }

  try {
    await teamStore.fetchMembers()
  } catch {
    show({
      type: 'warning',
      message: 'Unable to load team members for quick assign'
    })
  }
}

watch(() => locationStore.activeLocationId, subscribeToTickets, { immediate: true })
watch(() => locationStore.activeLocationId, fetchTeamMembers, { immediate: true })

watch(
  () => route.query.view,
  (queryView) => {
    const next = getViewFromQuery(queryView)
    if (next !== activeView.value) {
      activeView.value = next
    }
  }
)

watch(activeView, async (view) => {
  const current = getViewFromQuery(route.query.view)
  if (current === view) {
    return
  }

  const nextQuery = { ...route.query }

  if (view === 'all') {
    delete nextQuery.view
  } else {
    nextQuery.view = view
  }

  await router.replace({ query: nextQuery })
})

onUnmounted(() => {
  subscription?.unsubscribe()
})

const createTicket = async () => {
  const ticket = await repository.saveTicket({ status: 'New' })
  await navigateTo(`/tickets/${ticket.id}?edit=1`)
}

const openTicket = async (ticketId: string) => {
  await navigateTo(`/tickets/${ticketId}`)
}

const onKanbanDrop = async ({ ticketId, toStatus }: KanbanColumnDropPayload) => {
  const existing = tickets.value.find((ticket) => ticket.id === ticketId)
  if (!existing || existing.status === toStatus) {
    return
  }

  try {
    await repository.saveTicket({
      id: ticketId,
      status: toStatus
    })
    await syncStore.syncNow()

    show({
      type: 'success',
      message: `Ticket moved to ${toStatus}`
    })
  } catch {
    show({
      type: 'error',
      message: 'Failed to update ticket status'
    })
  }
}

const openQuickAssign = (ticketId: string) => {
  quickAssignTicketId.value = ticketId
  quickAssignOpen.value = true
}

const submitQuickAssign = async (payload: QuickAssignPayload) => {
  quickAssignSubmitting.value = true

  try {
    await repository.saveTicket({
      id: payload.ticketId,
      assignedToUserId: payload.assignedToUserId,
      scheduledStartAt: payload.scheduledStartAt,
      scheduledEndAt: payload.scheduledEndAt,
      status: 'Scheduled'
    })
    await syncStore.syncNow()

    quickAssignOpen.value = false
    quickAssignTicketId.value = ''

    show({
      type: 'success',
      message: 'Ticket assigned successfully'
    })
  } catch {
    show({
      type: 'error',
      message: 'Failed to assign ticket'
    })
  } finally {
    quickAssignSubmitting.value = false
  }
}
</script>
