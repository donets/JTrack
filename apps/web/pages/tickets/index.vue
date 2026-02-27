<template>
  <section class="space-y-5">
    <JPageHeader
      title="Tickets"
      description="Data source: RxDB (offline-first)."
      :breadcrumbs="breadcrumbs"
    />

    <form class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4" @submit.prevent="createTicket">
      <input v-model="form.title" class="rounded border border-slate-300 px-3 py-2" placeholder="Title" required />
      <input
        v-model="form.description"
        class="rounded border border-slate-300 px-3 py-2"
        placeholder="Description"
      />
      <select v-model="form.priority" class="rounded border border-slate-300 px-3 py-2">
        <option value="">Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button class="rounded bg-emerald-600 px-3 py-2 text-white" type="submit">Create ticket</button>
    </form>

    <section class="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div class="grid gap-3 lg:grid-cols-4">
        <div class="lg:col-span-2">
          <JSearchInput v-model="searchQuery" placeholder="Search tickets..." />
        </div>

        <JSelect v-model="statusFilter" :options="statusOptions" />
        <JSelect v-model="priorityFilter" :options="priorityOptions" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <JSelect v-model="assigneeFilter" :options="assigneeOptions" />

        <JSelect v-model="perPageModel" :options="perPageOptions" />
      </div>

      <div class="text-xs text-slate-500">{{ totalTickets }} tickets</div>
    </section>

    <JTable
      :columns="columns"
      :rows="pageRows"
      :sortable="true"
      :sort-key="sortKey"
      :sort-direction="sortDirection"
      :empty-text="emptyText"
      @sort-change="onSortChange"
    >
      <template #cell-ticketCode="{ row }">
        <NuxtLink :to="`/tickets/${row.id}`" class="font-semibold text-ink hover:underline">
          {{ row.ticketCode }}
        </NuxtLink>
      </template>

      <template #cell-title="{ row }">
        <NuxtLink :to="`/tickets/${row.id}`" class="font-medium text-ink hover:text-mint hover:underline">
          {{ row.title }}
        </NuxtLink>
      </template>

      <template #cell-status="{ row }">
        <JBadge :variant="statusToBadgeVariant(row.status)">{{ statusToLabel(row.status) }}</JBadge>
      </template>

      <template #cell-priority="{ row }">
        <JBadge :variant="priorityToBadgeVariant(row.priority)">{{ formatPriorityLabel(row.priority) }}</JBadge>
      </template>

      <template #cell-assignedToUserId="{ row }">
        <div v-if="row.assignedToUserId" class="inline-flex items-center gap-2">
          <JAvatar :name="resolveAssigneeName(row.assignedToUserId)" size="sm" />
          <span>{{ resolveAssigneeName(row.assignedToUserId) }}</span>
        </div>
        <span v-else class="text-slate-400">—</span>
      </template>

      <template #cell-scheduledStartAt="{ value }">
        <span>{{ formatScheduled(value) }}</span>
      </template>

      <template #cell-totalAmountCents="{ row }">
        <span>{{ formatAmount(row.totalAmountCents, row.currency) }}</span>
      </template>

      <template #cell-updatedAt="{ value }">
        <span class="text-xs text-slate-600">{{ formatDateTime(value) }}</span>
      </template>
    </JTable>

    <JPagination
      :total="totalTickets"
      :per-page="perPage"
      :current-page="page"
      @update:current-page="onPageChange"
    />
  </section>
</template>

<script setup lang="ts">
import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from 'vue-router'
import type { TableColumn, BreadcrumbItem } from '~/types/ui'
import type { Ticket, TicketStatus } from '@jtrack/shared'
import {
  priorityToBadgeVariant,
  statusToBadgeVariant,
  statusToLabel
} from '~/utils/ticket-status'

interface TicketRow {
  id: string
  ticketCode: string
  title: string
  status: TicketStatus
  priority: string | null
  assignedToUserId: string | null
  scheduledStartAt: string | null
  totalAmountCents: number | null
  currency: string
  updatedAt: string
}

interface TeamMember {
  id: string
  name: string
}

type SortDirection = 'asc' | 'desc'
type SortKey = 'title' | 'status' | 'priority' | 'updatedAt'

const SORT_KEYS = new Set<SortKey>(['title', 'status', 'priority', 'updatedAt'])
const PER_PAGE_VALUES = [25, 50, 100] as const
const STATUS_VALUES: TicketStatus[] = ['New', 'Scheduled', 'InProgress', 'Done', 'Invoiced', 'Paid', 'Canceled']
const PRIORITY_VALUES = ['low', 'medium', 'high'] as const

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const locationStore = useLocationStore()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const api = useApiClient()
const db = useRxdb()
const { hasPrivilege } = useRbacGuard()
const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Tickets', to: '/tickets' }
]

setBreadcrumbs(breadcrumbs)

const tickets = ref<Ticket[]>([])
const teamMembers = ref<TeamMember[]>([])
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const assigneeFilter = ref('')
const perPage = ref<number>(25)
const page = ref(1)
const sortKey = ref<SortKey>('updatedAt')
const sortDirection = ref<SortDirection>('desc')
const loadingUsers = ref(false)
const isApplyingRouteQuery = ref(false)

let ticketSubscription: { unsubscribe: () => void } | null = null

const form = reactive({
  title: '',
  description: '',
  priority: ''
})

const columns: TableColumn[] = [
  { key: 'ticketCode', label: '#', width: '100px' },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'status', label: 'Status', sortable: true, width: '130px' },
  { key: 'priority', label: 'Priority', sortable: true, width: '120px' },
  { key: 'assignedToUserId', label: 'Assigned', width: '200px' },
  { key: 'scheduledStartAt', label: 'Scheduled', width: '160px' },
  { key: 'totalAmountCents', label: 'Amount', align: 'right', width: '120px' },
  { key: 'updatedAt', label: 'Updated', sortable: true, width: '170px' }
]

const statusOptions = [
  { value: '', label: 'Status: All' },
  ...STATUS_VALUES.map((status) => ({ value: status, label: `Status: ${statusToLabel(status)}` }))
]

const priorityOptions = [
  { value: '', label: 'Priority: All' },
  ...PRIORITY_VALUES.map((priority) => ({ value: priority, label: `Priority: ${formatPriorityLabel(priority)}` }))
]

const perPageOptions = PER_PAGE_VALUES.map((value) => ({
  value: String(value),
  label: `Rows: ${value}`
}))

const assigneeNameMap = computed(() => {
  const map = new Map<string, string>()

  if (authStore.user) {
    map.set(authStore.user.id, authStore.user.name)
  }

  for (const member of teamMembers.value) {
    map.set(member.id, member.name)
  }

  return map
})

const assigneeOptions = computed(() => {
  const options = [
    { value: '', label: 'Assigned: Anyone' },
    { value: 'unassigned', label: 'Assigned: Unassigned' }
  ]

  const sortedMembers = [...teamMembers.value].sort((left, right) => left.name.localeCompare(right.name))

  for (const member of sortedMembers) {
    options.push({ value: member.id, label: `Assigned: ${member.name}` })
  }

  if (authStore.user && !teamMembers.value.some((member) => member.id === authStore.user?.id)) {
    options.push({ value: authStore.user.id, label: `Assigned: ${authStore.user.name}` })
  }

  return options
})

const perPageModel = computed({
  get: () => String(perPage.value),
  set: (value: string) => {
    const parsed = Number.parseInt(value, 10)
    perPage.value = PER_PAGE_VALUES.includes(parsed as (typeof PER_PAGE_VALUES)[number]) ? parsed : 25
  }
})

const queryValue = (value: LocationQueryValue | LocationQueryValue[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

const parsePositiveInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

const isSortKey = (value: string): value is SortKey => SORT_KEYS.has(value as SortKey)

const normalizeQuery = (query: LocationQuery | LocationQueryRaw) => {
  const entries: Array<[string, string]> = []

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === undefined || rawValue === null) {
      continue
    }

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue
    if (value === undefined || value === null) {
      continue
    }

    const serialized = String(value)
    if (!serialized) {
      continue
    }

    entries.push([key, serialized])
  }

  entries.sort((left, right) => left[0].localeCompare(right[0]))

  return entries
}

const queryEquals = (left: LocationQuery | LocationQueryRaw, right: LocationQuery | LocationQueryRaw) => {
  const leftEntries = normalizeQuery(left)
  const rightEntries = normalizeQuery(right)

  if (leftEntries.length !== rightEntries.length) {
    return false
  }

  return leftEntries.every(([leftKey, leftValue], index) => {
    const [rightKey, rightValue] = rightEntries[index] ?? []
    return leftKey === rightKey && leftValue === rightValue
  })
}

const applyQuery = (query: LocationQuery) => {
  const nextStatus = queryValue(query.status)
  statusFilter.value = STATUS_VALUES.includes(nextStatus as TicketStatus) ? nextStatus : ''

  const nextPriority = queryValue(query.priority).toLowerCase()
  priorityFilter.value = PRIORITY_VALUES.includes(nextPriority as (typeof PRIORITY_VALUES)[number])
    ? nextPriority
    : ''

  assigneeFilter.value = queryValue(query.assignee)
  searchQuery.value = queryValue(query.q)

  const nextSort = queryValue(query.sort)
  sortKey.value = isSortKey(nextSort) ? nextSort : 'updatedAt'

  const nextDirection = queryValue(query.dir)
  sortDirection.value = nextDirection === 'asc' ? 'asc' : 'desc'

  const nextPerPage = parsePositiveInt(queryValue(query.perPage), 25)
  perPage.value = PER_PAGE_VALUES.includes(nextPerPage as (typeof PER_PAGE_VALUES)[number]) ? nextPerPage : 25

  page.value = parsePositiveInt(queryValue(query.page), 1)
}

const buildQuery = (): LocationQueryRaw => {
  const query: LocationQueryRaw = {}

  if (statusFilter.value) {
    query.status = statusFilter.value
  }

  if (priorityFilter.value) {
    query.priority = priorityFilter.value
  }

  if (assigneeFilter.value) {
    query.assignee = assigneeFilter.value
  }

  const trimmedSearch = searchQuery.value.trim()
  if (trimmedSearch) {
    query.q = trimmedSearch
  }

  if (sortKey.value !== 'updatedAt') {
    query.sort = sortKey.value
  }

  if (sortDirection.value !== 'desc') {
    query.dir = sortDirection.value
  }

  if (perPage.value !== 25) {
    query.perPage = String(perPage.value)
  }

  if (page.value > 1) {
    query.page = String(page.value)
  }

  return query
}

const ticketSelector = computed<Record<string, unknown> | null>(() => {
  if (!locationStore.activeLocationId) {
    return null
  }

  const selector: Record<string, unknown> = {
    locationId: locationStore.activeLocationId
  }

  if (statusFilter.value) {
    selector.status = statusFilter.value
  }

  if (priorityFilter.value) {
    const normalizedPriority = priorityFilter.value.toLowerCase()
    const capitalized = normalizedPriority.charAt(0).toUpperCase() + normalizedPriority.slice(1)

    selector.priority = {
      $in: [normalizedPriority, capitalized, normalizedPriority.toUpperCase()]
    }
  }

  if (assigneeFilter.value === 'unassigned') {
    selector.assignedToUserId = null
  } else if (assigneeFilter.value) {
    selector.assignedToUserId = assigneeFilter.value
  }

  return selector
})

const subscribeToTickets = () => {
  ticketSubscription?.unsubscribe()

  if (!ticketSelector.value) {
    tickets.value = []
    return
  }

  ticketSubscription = db.collections.tickets
    .find({
      selector: ticketSelector.value
    })
    .$
    .subscribe((docs: Array<{ toJSON: () => Ticket }>) => {
      tickets.value = docs.map((doc) => doc.toJSON()).filter((ticket) => !ticket.deletedAt)
    })
}

const loadTeamMembers = async () => {
  if (!locationStore.activeLocationId || !hasPrivilege('users.read')) {
    teamMembers.value = []
    return
  }

  loadingUsers.value = true

  try {
    const users = await api.get<Array<{ id: string; name: string }>>('/users')
    teamMembers.value = users
      .map((user) => ({ id: user.id, name: user.name }))
      .filter((user) => user.name.trim().length > 0)
  } catch {
    teamMembers.value = []
  } finally {
    loadingUsers.value = false
  }
}

const filteredBySearch = computed(() => {
  const needle = searchQuery.value.trim().toLowerCase()
  if (!needle) {
    return tickets.value
  }

  return tickets.value.filter((ticket) => {
    const haystack = [ticket.id, ticket.title, ticket.description ?? ''].join(' ').toLowerCase()
    return haystack.includes(needle)
  })
})

const sortedTickets = computed(() => {
  const multiplier = sortDirection.value === 'asc' ? 1 : -1

  const normalize = (ticket: Ticket) => {
    if (sortKey.value === 'updatedAt') {
      const timestamp = new Date(ticket.updatedAt).getTime()
      return Number.isNaN(timestamp) ? 0 : timestamp
    }

    if (sortKey.value === 'priority') {
      return (ticket.priority ?? '').toLowerCase()
    }

    if (sortKey.value === 'status') {
      return ticket.status.toLowerCase()
    }

    return ticket.title.toLowerCase()
  }

  return [...filteredBySearch.value].sort((left, right) => {
    const leftValue = normalize(left)
    const rightValue = normalize(right)

    if (leftValue < rightValue) {
      return -1 * multiplier
    }

    if (leftValue > rightValue) {
      return 1 * multiplier
    }

    return 0
  })
})

const totalTickets = computed(() => sortedTickets.value.length)

const totalPages = computed(() => {
  if (totalTickets.value <= 0) {
    return 1
  }

  return Math.ceil(totalTickets.value / perPage.value)
})

const paginatedTickets = computed(() => {
  const offset = (page.value - 1) * perPage.value
  return sortedTickets.value.slice(offset, offset + perPage.value)
})

const pageRows = computed<TicketRow[]>(() =>
  paginatedTickets.value.map((ticket) => ({
    id: ticket.id,
    ticketCode: formatTicketCode(ticket.id),
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    assignedToUserId: ticket.assignedToUserId,
    scheduledStartAt: ticket.scheduledStartAt,
    totalAmountCents: ticket.totalAmountCents,
    currency: ticket.currency,
    updatedAt: ticket.updatedAt
  }))
)

const emptyText = computed(() => {
  if (loadingUsers.value) {
    return 'Loading tickets...'
  }

  if (tickets.value.length === 0) {
    return 'No tickets in local store'
  }

  return 'No tickets match current filters'
})

watch(
  () => route.query,
  (query) => {
    isApplyingRouteQuery.value = true
    applyQuery(query)
    isApplyingRouteQuery.value = false
  },
  { immediate: true }
)

watch([statusFilter, priorityFilter, assigneeFilter, searchQuery, perPage], () => {
  if (isApplyingRouteQuery.value) {
    return
  }

  page.value = 1
})

watch([statusFilter, priorityFilter, assigneeFilter, searchQuery, sortKey, sortDirection, perPage, page], async () => {
  if (isApplyingRouteQuery.value) {
    return
  }

  const nextQuery = buildQuery()
  if (queryEquals(route.query, nextQuery)) {
    return
  }

  await router.replace({ query: nextQuery })
})

watch([() => locationStore.activeLocationId, ticketSelector], subscribeToTickets, { immediate: true })
watch([() => locationStore.activeLocationId, () => hasPrivilege('users.read')], loadTeamMembers, { immediate: true })

watch([page, totalPages], () => {
  if (page.value > totalPages.value) {
    page.value = totalPages.value
  }

  if (page.value < 1) {
    page.value = 1
  }
})

onUnmounted(() => {
  ticketSubscription?.unsubscribe()
})

const onSortChange = (payload: { key: string; direction: SortDirection }) => {
  if (!isSortKey(payload.key)) {
    return
  }

  sortKey.value = payload.key
  sortDirection.value = payload.direction
  page.value = 1
}

const onPageChange = (nextPage: number) => {
  page.value = nextPage
}

const createTicket = async () => {
  await repository.saveTicket({
    title: form.title,
    description: form.description || undefined,
    priority: form.priority || undefined,
    status: 'New'
  })

  form.title = ''
  form.description = ''
  form.priority = ''

  await syncStore.syncNow()
}

const resolveAssigneeName = (assigneeId: string) => assigneeNameMap.value.get(assigneeId) ?? `User ${assigneeId.slice(0, 8)}`

const formatTicketCode = (ticketId: string) => `#${ticketId.slice(0, 8).toUpperCase()}`

const formatPriorityLabel = (priority: string | null) => {
  const normalized = priority?.trim().toLowerCase()

  if (!normalized) {
    return 'None'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const formatDateTime = (value: string) => {
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

const formatScheduled = (value: string | null) => {
  if (!value) {
    return '—'
  }

  return formatDateTime(value)
}

const formatAmount = (amountCents: number | null, currency: string) => {
  if (amountCents === null) {
    return '—'
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0
  }).format(amountCents / 100)
}
</script>
