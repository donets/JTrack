<template>
  <section class="space-y-5">
    <section class="rounded-xl border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-3 sm:gap-3 sm:px-5">
        <div class="min-w-0 flex-1 sm:max-w-52">
          <JSearchInput v-model="searchQuery" placeholder="Search…" />
        </div>

        <div class="w-28 shrink-0 sm:w-40">
          <JListbox v-model="statusFilter" :options="statusOptions" />
        </div>

        <JButton class="shrink-0 !px-3 sm:!px-4" @click="openCreateModal">
          <span class="sm:hidden">+</span>
          <span class="hidden sm:inline">New Ticket</span>
        </JButton>
      </div>

      <div class="grid gap-3 px-3 pb-3 pt-3 sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
        <JListbox v-model="priorityFilter" :options="priorityOptions" />
        <JListbox v-model="assigneeFilter" :options="assigneeOptions" />
        <JListbox v-model="dateRangeFilter" :options="dateRangeOptions" />
        <JListbox v-if="activeView === 'all'" v-model="perPageModel" :options="perPageOptions" />
      </div>

      <div class="px-3 pb-3 text-xs text-slate-500 sm:px-5">{{ totalTickets }} tickets</div>

      <div class="border-t border-slate-100 px-3 sm:px-5">
        <JTabs
          v-model="activeView"
          :tabs="viewTabs"
          id-prefix="tickets-tab"
          panel-id-prefix="tickets-view-panel"
        />
      </div>
    </section>

    <template v-if="activeView === 'all'">
      <div v-if="ticketsLoading" class="space-y-2 rounded-xl border border-slate-200 bg-white p-3 sm:p-5">
        <div v-for="rowIndex in 6" :key="`tickets-loading-${rowIndex}`" class="grid grid-cols-7 gap-3">
          <JSkeleton v-for="columnIndex in 7" :key="`tickets-loading-${rowIndex}-${columnIndex}`" height="18px" />
        </div>
      </div>

      <JEmptyState
        v-else-if="ticketsLoadError"
        icon="⚠️"
        title="Could not load tickets"
        description="The local ticket store could not be read. Retry to restore the list."
        :action="{ label: 'Retry', onClick: retryTicketsLoad }"
      />

      <JEmptyState
        v-else-if="totalTickets === 0 && !hasActiveFilters"
        icon="🧾"
        title="No tickets yet"
        description="Create your first ticket to get started."
        :action="{ label: '+ New Ticket', onClick: openCreateModal }"
      />

      <JEmptyState
        v-else-if="totalTickets === 0"
        icon="🔎"
        title="No tickets match your filters"
        description="Try adjusting your filters or search terms."
        :action="{ label: 'Clear filters', onClick: clearFilters }"
      />

      <template v-else>
        <JTable
          :columns="columns"
          :rows="pageRows"
          :sortable="true"
          :row-clickable="true"
          :sort-key="sortKey"
          :sort-direction="sortDirection"
          @sort-change="onSortChange"
          @row-click="onTableRowClick"
        >
          <template #cell-title="{ row }">
            <NuxtLink :to="`/tickets/${row.id}`" class="font-medium text-ink hover:text-mint hover:underline">
              <span class="mr-1 text-slate-500">{{ formatTicketNumber(row.ticketNumber, row.id) }}</span>
              <span>{{ row.title }}</span>
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
      </template>
    </template>

    <div
      v-else-if="activeView === 'board'"
      id="tickets-view-panel-board"
      role="tabpanel"
      aria-labelledby="tickets-tab-board"
      class="overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-5"
    >
      <div class="flex min-w-max items-start gap-3 pb-1">
        <TicketKanbanColumn
          v-for="column in boardColumns"
          :key="column.status"
          :status="column.status"
          :title="column.label"
          :color="column.color"
          :tickets="kanbanColumns[column.status] ?? []"
          :show-ticket-code="true"
          @ticket-drop="onKanbanDrop"
          @open-ticket="openTicket"
          @quick-assign="openQuickAssign"
        />
      </div>
    </div>

    <div
      v-else-if="activeView === 'calendar'"
      id="tickets-view-panel-calendar"
      role="tabpanel"
      aria-labelledby="tickets-tab-calendar"
      class="space-y-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-5"
    >
      <div
        v-if="calendarGroups.length === 0"
        class="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500"
      >
        No tickets scheduled for the current filters.
      </div>

      <section v-for="group in calendarGroups" :key="group.date" class="rounded-lg border border-slate-200">
        <header class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
          <h3 class="text-sm font-semibold text-ink">{{ group.label }}</h3>
          <span class="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
            {{ group.tickets.length }}
          </span>
        </header>

        <ul class="divide-y divide-slate-100">
          <li v-for="ticket in group.tickets" :key="ticket.id">
            <button
              type="button"
              class="block w-full px-3 py-2 text-left transition-colors hover:bg-slate-50"
              @click="openTicket(ticket.id)"
            >
              <p class="truncate text-sm font-semibold text-ink">
                <span class="mr-1 text-slate-500">{{ formatTicketNumber(ticket.ticketNumber, ticket.id) }}</span>
                {{ ticket.title }}
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ statusToLabel(ticket.status) }} · {{ formatScheduled(ticket.scheduledStartAt) }} ·
                {{ ticket.assignedToUserId ? resolveAssigneeName(ticket.assignedToUserId) : 'Unassigned' }}
              </p>
            </button>
          </li>
        </ul>
      </section>
    </div>

    <div
      v-else
      id="tickets-view-panel-map"
      role="tabpanel"
      aria-labelledby="tickets-tab-map"
      class="space-y-4"
    >
      <DispatchMapView
        :tickets="mapTickets"
        :selected-date="mapSelectedDate"
        :location-id="locationStore.activeLocationId ?? '00000000-0000-0000-0000-000000000000'"
        :technician-names="technicianNameMap"
        @open-ticket="openTicket"
        @quick-assign="openQuickAssign"
      />
    </div>

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
import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from 'vue-router'
import type {
  TableColumn,
  BreadcrumbItem,
  KanbanColumnDropPayload,
  KanbanColumnItem,
  KanbanTicketCardItem,
  DispatchMapTicket,
  QuickAssignPayload,
  QuickAssignTechnicianOption,
  TabItem
} from '~/types/ui'
import type { Ticket, TicketStatus } from '@jtrack/shared'
import {
  priorityToBadgeVariant,
  statusToBadgeVariant,
  statusToLabel
} from '~/utils/ticket-status'
import {
  formatDateTime,
  formatMoney,
  formatTicketNumber,
  formatPriorityLabel,
  parseAmountToCents
} from '~/utils/format'

interface TicketRow {
  id: string
  ticketNumber?: number
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
type TicketView = 'all' | 'board' | 'calendar' | 'map'
type QueryView = string | null | (string | null)[] | undefined

const SORT_KEYS = new Set<SortKey>(['title', 'status', 'priority', 'updatedAt'])
const PER_PAGE_VALUES = [25, 50, 100] as const
const STATUS_VALUES: TicketStatus[] = ['New', 'Scheduled', 'InProgress', 'Done', 'Invoiced', 'Paid', 'Canceled']
const PRIORITY_VALUES = ['low', 'medium', 'high'] as const
const DATE_RANGE_VALUES: DateRangeValue[] = ['', 'today', 'next7d', 'next30d']

const boardColumns: KanbanColumnItem[] = [
  { status: 'New', label: 'New', color: 'text-sky' },
  { status: 'Scheduled', label: 'Scheduled', color: 'text-violet' },
  { status: 'InProgress', label: 'In Progress', color: 'text-flame' },
  { status: 'Done', label: 'Done', color: 'text-mint' },
  { status: 'Invoiced', label: 'Invoiced', color: 'text-sky' },
  { status: 'Paid', label: 'Paid', color: 'text-mint' },
  { status: 'Canceled', label: 'Canceled', color: 'text-slate-400' }
]

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const locationStore = useLocationStore()
const teamStore = useTeamStore()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const db = useRxdb()
const toast = useToast()
const { hasPrivilege } = useRbacGuard()
const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Tickets', to: '/tickets' }
]

setBreadcrumbs(breadcrumbs)

const getViewFromQuery = (value: QueryView): TicketView => {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === 'board' || raw === 'calendar' || raw === 'map') {
    return raw
  }
  return 'all'
}

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
const ticketsLoading = ref(true)
const ticketsLoadError = ref<string | null>(null)
const isApplyingRouteQuery = ref(false)
const activeView = ref<TicketView>(getViewFromQuery(route.query.view))

const createModalOpen = ref(false)
const createSubmitting = ref(false)

const quickAssignOpen = ref(false)
const quickAssignSubmitting = ref(false)
const quickAssignTicketId = ref('')

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
  { key: 'title', label: 'Title', sortable: true },
  { key: 'status', label: 'Status', sortable: true, width: '130px' },
  { key: 'priority', label: 'Priority', sortable: true, width: '120px' },
  { key: 'assignedToUserId', label: 'Assigned', width: '200px' },
  { key: 'scheduledStartAt', label: 'Scheduled', width: '160px' },
  { key: 'totalAmountCents', label: 'Amount', align: 'right', width: '120px' },
  { key: 'updatedAt', label: 'Updated', sortable: true, width: '170px', hideClass: 'hidden lg:table-cell' }
]

const statusOptions = [
  { value: '', label: 'All' },
  ...STATUS_VALUES.map((status) => ({ value: status, label: statusToLabel(status) }))
]

const priorityOptions = [
  { value: '', label: 'All' },
  ...PRIORITY_VALUES.map((priority) => ({ value: priority, label: formatPriorityLabel(priority) }))
]

const dateRangeOptions = [
  { value: '', label: 'Any' },
  { value: 'today', label: 'Today' },
  { value: 'next7d', label: 'Next 7 days' },
  { value: 'next30d', label: 'Next 30 days' }
]

const perPageOptions = PER_PAGE_VALUES.map((value) => ({
  value: String(value),
  label: String(value)
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
    { value: '', label: 'Anyone' },
    { value: 'unassigned', label: 'Unassigned' }
  ]

  for (const member of sortedTeamMembers.value) {
    options.push({ value: member.id, label: member.name })
  }

  if (authStore.user && !teamMembers.value.some((member) => member.id === authStore.user?.id)) {
    options.push({ value: authStore.user.id, label: authStore.user.name })
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

const technicianOptions = computed<QuickAssignTechnicianOption[]>(() => {
  const jobsByTechnician = new Map<string, number>()

  const activeStatuses: TicketStatus[] = ['New', 'Scheduled', 'InProgress']
  for (const ticket of tickets.value) {
    if (!ticket.assignedToUserId || !activeStatuses.includes(ticket.status)) continue
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
      avatarName: member.name,
      jobCount: jobsByTechnician.get(member.id) ?? 0
    }))
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

  if (activeView.value !== 'all') {
    query.view = activeView.value
  }

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
  ticketsLoadError.value = null
  ticketsLoading.value = true

  if (!ticketSelector.value) {
    tickets.value = []
    ticketsLoading.value = false
    return
  }

  try {
    ticketSubscription = db.collections.tickets
      .find({
        selector: ticketSelector.value
      })
      .$
      .subscribe(
        (docs: Array<{ toJSON: () => Ticket }>) => {
          tickets.value = docs.map((doc) => doc.toJSON()).filter((ticket) => !ticket.deletedAt)
          ticketsLoading.value = false
          ticketsLoadError.value = null
        },
        () => {
          tickets.value = []
          ticketsLoading.value = false
          ticketsLoadError.value = 'rxdb-subscription-failed'
        }
      )
  } catch {
    tickets.value = []
    ticketsLoading.value = false
    ticketsLoadError.value = 'rxdb-query-failed'
  }
}

const retryTicketsLoad = () => {
  subscribeToTickets()
}

const clearFilters = () => {
  statusFilter.value = ''
  priorityFilter.value = ''
  assigneeFilter.value = ''
  dateRangeFilter.value = ''
  searchQuery.value = ''
  page.value = 1
}

const loadTeamMembers = async () => {
  if (!locationStore.activeLocationId || !hasPrivilege('users.read')) {
    teamMembers.value = []
    return
  }

  loadingUsers.value = true

  try {
    const members = await teamStore.fetchMembers()
    teamMembers.value = (members ?? [])
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

const hasActiveFilters = computed(
  () =>
    Boolean(statusFilter.value) ||
    Boolean(priorityFilter.value) ||
    Boolean(assigneeFilter.value) ||
    Boolean(dateRangeFilter.value) ||
    Boolean(searchQuery.value.trim())
)

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
    ticketNumber: ticket.ticketNumber,
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

const boardTickets = computed<KanbanTicketCardItem[]>(() =>
  filteredByDate.value.map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    assignedToUserId: ticket.assignedToUserId,
    assigneeName: ticket.assignedToUserId
      ? assigneeNameMap.value.get(ticket.assignedToUserId)
      : undefined,
    dueAt: ticket.scheduledStartAt,
    scheduledStartAt: ticket.scheduledStartAt,
    scheduledEndAt: ticket.scheduledEndAt,
    updatedAt: ticket.updatedAt
  }))
)

const mapTickets = computed<DispatchMapTicket[]>(() =>
  filteredByDate.value.map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    locationId: ticket.locationId,
    title: ticket.title,
    status: ticket.status,
    assignedToUserId: ticket.assignedToUserId,
    scheduledStartAt: ticket.scheduledStartAt
  }))
)

const technicianNameMap = computed<Record<string, string>>(() =>
  Object.fromEntries(Array.from(assigneeNameMap.value.entries()))
)

const formatDateKey = (iso: string) => {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const year = parsed.getUTCFullYear()
  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const calendarGroups = computed(() => {
  const buckets = new Map<string, Ticket[]>()

  for (const ticket of filteredByDate.value) {
    const source = ticket.scheduledStartAt ?? ticket.updatedAt
    const key = formatDateKey(source)
    if (!key) {
      continue
    }

    if (!buckets.has(key)) {
      buckets.set(key, [])
    }

    buckets.get(key)?.push(ticket)
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, groupTickets]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      tickets: groupTickets.sort((left, right) => {
        const leftTs = new Date(left.scheduledStartAt ?? left.updatedAt).getTime()
        const rightTs = new Date(right.scheduledStartAt ?? right.updatedAt).getTime()
        if (Number.isNaN(leftTs) || Number.isNaN(rightTs) || leftTs === rightTs) {
          return left.title.localeCompare(right.title)
        }
        return leftTs - rightTs
      })
    }))
})

const mapSelectedDate = computed(() => {
  if (dateRangeFilter.value === 'today') {
    return formatDateKey(new Date().toISOString())
  }

  return calendarGroups.value[0]?.date ?? formatDateKey(new Date().toISOString())
})

const viewTabs = computed<TabItem[]>(() => [
  { key: 'all', label: 'All', count: totalTickets.value },
  { key: 'board', label: 'Board', count: boardTickets.value.length },
  { key: 'calendar', label: 'Calendar', count: calendarGroups.value.length },
  { key: 'map', label: 'Map', count: mapTickets.value.length }
])

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

watch(
  () => route.query,
  (query) => {
    isApplyingRouteQuery.value = true
    applyQuery(query)
    isApplyingRouteQuery.value = false
  },
  { immediate: true }
)

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

  const nextQuery = buildQuery()
  if (queryEquals(route.query, nextQuery)) {
    return
  }

  await router.replace({ query: nextQuery })
})

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

const onTableRowClick = (row: Record<string, unknown>) => {
  const ticketId = typeof row.id === 'string' ? row.id : ''
  if (!ticketId) {
    return
  }

  navigateTo(`/tickets/${ticketId}`)
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
    await repository.saveTicket({ id: ticketId, status: toStatus })
    await syncStore.syncNow()
    toast.show({ type: 'success', message: `Ticket moved to ${toStatus}` })
  } catch {
    toast.show({ type: 'error', message: 'Failed to update ticket status' })
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
    toast.show({ type: 'success', message: 'Ticket assigned successfully' })
  } catch {
    toast.show({ type: 'error', message: 'Failed to assign ticket' })
  } finally {
    quickAssignSubmitting.value = false
  }
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
