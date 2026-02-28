<template>
  <section class="space-y-5">
    <JPageHeader
      title="Tickets"
      description="Data source: RxDB (offline-first)."
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <JButton size="sm" @click="openCreateModal">+ New Ticket</JButton>
      </template>
    </JPageHeader>

    <section class="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div class="grid gap-3 lg:grid-cols-4">
        <div class="lg:col-span-2">
          <JSearchInput v-model="searchQuery" placeholder="Search tickets..." />
        </div>

        <JSelect v-model="statusFilter" :options="statusOptions" />
        <JSelect v-model="priorityFilter" :options="priorityOptions" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <JSelect v-model="assigneeFilter" :options="assigneeOptions" />

        <JSelect v-model="dateRangeFilter" :options="dateRangeOptions" />

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
        <span>{{ formatMoney(row.totalAmountCents, row.currency) }}</span>
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

    <JModal v-model="createModalOpen" title="Create New Ticket" size="lg">
      <form id="create-ticket-form" class="space-y-4" @submit.prevent="submitCreateTicket">
        <JInput
          v-model="createForm.title"
          label="Title *"
          placeholder="Brief description of the job"
          :error="createErrors.title"
        />

        <JTextarea
          v-model="createForm.description"
          label="Description"
          placeholder="Detailed notes, customer info, special instructions..."
          :rows="3"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <JSelect v-model="createForm.priority" label="Priority" :options="createPriorityOptions" />
          <JSelect v-model="createForm.assignee" label="Assign to" :options="createAssigneeOptions" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <JDatePicker
            v-model="createForm.scheduledStartAt"
            include-time
            label="Scheduled start"
            :error="createErrors.scheduledStartAt"
          />
          <JDatePicker
            v-model="createForm.scheduledEndAt"
            include-time
            label="Scheduled end"
            :error="createErrors.scheduledEndAt"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <JInput
            v-model="createForm.amount"
            type="number"
            label="Amount"
            placeholder="0.00"
            :error="createErrors.amount"
          />
          <JSelect v-model="createForm.currency" label="Currency" :options="currencyOptions" />
        </div>
      </form>

      <template #footer>
        <JButton variant="secondary" :disabled="createSubmitting" @click="closeCreateModal">Cancel</JButton>
        <JButton type="submit" form="create-ticket-form" :loading="createSubmitting">Create Ticket</JButton>
      </template>
    </JModal>
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
import {
  formatDateTime,
  formatMoney,
  formatPriorityLabel,
  formatTicketCode,
  parseAmountToCents
} from '~/utils/format'

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
type DateRangeValue = '' | 'today' | 'next7d' | 'next30d'

const SORT_KEYS = new Set<SortKey>(['title', 'status', 'priority', 'updatedAt'])
const PER_PAGE_VALUES = [25, 50, 100] as const
const STATUS_VALUES: TicketStatus[] = ['New', 'Scheduled', 'InProgress', 'Done', 'Invoiced', 'Paid', 'Canceled']
const PRIORITY_VALUES = ['low', 'medium', 'high'] as const
const DATE_RANGE_VALUES: DateRangeValue[] = ['', 'today', 'next7d', 'next30d']

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const locationStore = useLocationStore()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const api = useApiClient()
const db = useRxdb()
const toast = useToast()
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
const dateRangeFilter = ref<DateRangeValue>('')
const perPage = ref<number>(25)
const page = ref(1)
const sortKey = ref<SortKey>('updatedAt')
const sortDirection = ref<SortDirection>('desc')
const loadingUsers = ref(false)
const isApplyingRouteQuery = ref(false)

const createModalOpen = ref(false)
const createSubmitting = ref(false)

const createForm = reactive({
  title: '',
  description: '',
  priority: 'medium',
  assignee: '',
  scheduledStartAt: '',
  scheduledEndAt: '',
  amount: '',
  currency: 'EUR'
})

const createErrors = reactive({
  title: '',
  amount: '',
  scheduledStartAt: '',
  scheduledEndAt: ''
})

let ticketSubscription: { unsubscribe: () => void } | null = null

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

const dateRangeOptions = [
  { value: '', label: 'Date range: Any' },
  { value: 'today', label: 'Date range: Today' },
  { value: 'next7d', label: 'Date range: Next 7 days' },
  { value: 'next30d', label: 'Date range: Next 30 days' }
]

const perPageOptions = PER_PAGE_VALUES.map((value) => ({
  value: String(value),
  label: `Rows: ${value}`
}))

const createPriorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

const currencyOptions = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' }
]

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

const sortedTeamMembers = computed(() =>
  [...teamMembers.value].sort((left, right) => left.name.localeCompare(right.name))
)

const assigneeOptions = computed(() => {
  const options = [
    { value: '', label: 'Assigned: Anyone' },
    { value: 'unassigned', label: 'Assigned: Unassigned' }
  ]

  for (const member of sortedTeamMembers.value) {
    options.push({ value: member.id, label: `Assigned: ${member.name}` })
  }

  if (authStore.user && !teamMembers.value.some((member) => member.id === authStore.user?.id)) {
    options.push({ value: authStore.user.id, label: `Assigned: ${authStore.user.name}` })
  }

  return options
})

const createAssigneeOptions = computed(() => {
  const options = [{ value: '', label: '— Unassigned —' }]

  for (const member of sortedTeamMembers.value) {
    options.push({ value: member.id, label: member.name })
  }

  if (authStore.user && !teamMembers.value.some((member) => member.id === authStore.user?.id)) {
    options.push({ value: authStore.user.id, label: authStore.user.name })
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
  const nextDateRange = queryValue(query.dateRange)
  dateRangeFilter.value = DATE_RANGE_VALUES.includes(nextDateRange as DateRangeValue)
    ? (nextDateRange as DateRangeValue)
    : ''

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

  if (dateRangeFilter.value) {
    query.dateRange = dateRangeFilter.value
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

const filteredByDate = computed(() => {
  if (!dateRangeFilter.value) {
    return filteredBySearch.value
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const startMs = startOfToday.getTime()
  const endOfTodayMs = startMs + 24 * 60 * 60 * 1000 - 1
  const endOfNext7dMs = startMs + 7 * 24 * 60 * 60 * 1000 - 1
  const endOfNext30dMs = startMs + 30 * 24 * 60 * 60 * 1000 - 1

  return filteredBySearch.value.filter((ticket) => {
    const targetDate = ticket.scheduledStartAt || ticket.updatedAt
    const timestamp = new Date(targetDate).getTime()

    if (Number.isNaN(timestamp)) {
      return false
    }

    if (dateRangeFilter.value === 'today') {
      return timestamp >= startMs && timestamp <= endOfTodayMs
    }

    if (dateRangeFilter.value === 'next7d') {
      return timestamp >= startMs && timestamp <= endOfNext7dMs
    }

    if (dateRangeFilter.value === 'next30d') {
      return timestamp >= startMs && timestamp <= endOfNext30dMs
    }

    return true
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

  return [...filteredByDate.value].sort((left, right) => {
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

watch([statusFilter, priorityFilter, assigneeFilter, dateRangeFilter, searchQuery, perPage], () => {
  if (isApplyingRouteQuery.value) {
    return
  }

  page.value = 1
})

watch(
  [statusFilter, priorityFilter, assigneeFilter, dateRangeFilter, searchQuery, sortKey, sortDirection, perPage, page],
  async () => {
  if (isApplyingRouteQuery.value) {
    return
  }

  const nextQuery = buildQuery()
  if (queryEquals(route.query, nextQuery)) {
    return
  }

    await router.replace({ query: nextQuery })
  }
)

watch(ticketSelector, subscribeToTickets, { immediate: true })
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

const resetCreateErrors = () => {
  createErrors.title = ''
  createErrors.amount = ''
  createErrors.scheduledStartAt = ''
  createErrors.scheduledEndAt = ''
}

const resetCreateForm = () => {
  createForm.title = ''
  createForm.description = ''
  createForm.priority = 'medium'
  createForm.assignee = ''
  createForm.scheduledStartAt = ''
  createForm.scheduledEndAt = ''
  createForm.amount = ''
  createForm.currency = 'EUR'
}

const validateCreateForm = () => {
  resetCreateErrors()

  let valid = true

  if (!createForm.title.trim()) {
    createErrors.title = 'Title is required'
    valid = false
  }

  const parsedAmount = parseAmountToCents(createForm.amount)
  if (Number.isNaN(parsedAmount)) {
    createErrors.amount = 'Amount must be a valid non-negative number'
    valid = false
  }

  const startTimestamp = createForm.scheduledStartAt ? new Date(createForm.scheduledStartAt).getTime() : null
  const endTimestamp = createForm.scheduledEndAt ? new Date(createForm.scheduledEndAt).getTime() : null

  if (startTimestamp !== null && Number.isNaN(startTimestamp)) {
    createErrors.scheduledStartAt = 'Invalid start date'
    valid = false
  }

  if (endTimestamp !== null && Number.isNaN(endTimestamp)) {
    createErrors.scheduledEndAt = 'Invalid end date'
    valid = false
  }

  if (
    startTimestamp !== null &&
    endTimestamp !== null &&
    !Number.isNaN(startTimestamp) &&
    !Number.isNaN(endTimestamp) &&
    endTimestamp < startTimestamp
  ) {
    createErrors.scheduledEndAt = 'End date must be after start date'
    valid = false
  }

  return valid
}

const openCreateModal = () => {
  resetCreateForm()
  resetCreateErrors()
  createModalOpen.value = true
}

const closeCreateModal = () => {
  createModalOpen.value = false
}

const submitCreateTicket = async () => {
  if (createSubmitting.value) {
    return
  }

  if (!validateCreateForm()) {
    return
  }

  const parsedAmount = parseAmountToCents(createForm.amount)

  createSubmitting.value = true

  try {
    const ticket = await repository.saveTicket({
      title: createForm.title.trim(),
      description: createForm.description.trim() || undefined,
      status: 'New',
      priority: createForm.priority || undefined,
      assignedToUserId: createForm.assignee || undefined,
      scheduledStartAt: createForm.scheduledStartAt || undefined,
      scheduledEndAt: createForm.scheduledEndAt || undefined,
      totalAmountCents: parsedAmount === null ? undefined : parsedAmount,
      currency: createForm.currency
    })

    resetCreateForm()
    resetCreateErrors()
    createModalOpen.value = false

    toast.show({
      type: 'success',
      message: 'Ticket created successfully'
    })

    await syncStore.syncNow()
    await navigateTo(`/tickets/${ticket.id}`)
  } catch {
    toast.show({
      type: 'error',
      message: 'Unable to create ticket'
    })
  } finally {
    createSubmitting.value = false
  }
}

const resolveAssigneeName = (assigneeId: string) => assigneeNameMap.value.get(assigneeId) ?? `User ${assigneeId.slice(0, 8)}`

const formatScheduled = (value: string | null) => {
  if (!value) {
    return '—'
  }

  return formatDateTime(value)
}
</script>
