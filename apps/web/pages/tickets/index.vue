<template>
  <section>
    <div class="rounded-xl border border-slate-200 bg-white">
      <div class="flex items-center gap-2 border-b border-slate-100 px-3 py-3 sm:gap-3 sm:px-5">
        <div class="min-w-0 flex-1 sm:max-w-52">
          <JSearchInput v-model="searchQuery" placeholder="Search…" />
        </div>
        <div class="w-28 shrink-0 sm:w-40">
          <JListbox v-model="statusFilter" :options="statusOptions" placeholder="All statuses" />
        </div>
        <JButton class="shrink-0 !px-3 sm:!px-4" @click="createTicket">
          <span class="sm:hidden">+</span>
          <span class="hidden sm:inline">New Ticket</span>
        </JButton>
      </div>
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
              <JBadge :variant="priorityVariant(ticket.priority)">{{ ticket.priority ?? 'None' }}</JBadge>
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
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const locationStore = useLocationStore()
const repository = useOfflineRepository()
const db = useRxdb()
const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Tickets', to: '/tickets' }
]

setBreadcrumbs(breadcrumbs)

const tickets = ref<any[]>([])
let subscription: any = null

const statusFilter = ref('')
const searchQuery = ref('')
const sortKey = ref<'status' | 'priority' | 'createdAt' | 'updatedAt'>('updatedAt')
const sortDir = ref<'asc' | 'desc'>('desc')

const sortableColumns = [
  { key: 'status' as const, label: 'Status', hideClass: '' },
  { key: 'priority' as const, label: 'Priority', hideClass: '' },
  { key: 'createdAt' as const, label: 'Created', hideClass: 'hidden lg:table-cell' },
  { key: 'updatedAt' as const, label: 'Updated', hideClass: 'hidden lg:table-cell' }
]

function toggleSort(key: typeof sortKey.value) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'createdAt' || key === 'updatedAt' ? 'desc' : 'asc'
  }
}

const statusOrder: Record<string, number> = {
  New: 0, Scheduled: 1, InProgress: 2, Done: 3, Invoiced: 4, Paid: 5, Canceled: 6
}

const priorityOrder: Record<string, number> = {
  high: 0, medium: 1, low: 2
}

function compareTickets(a: any, b: any): number {
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
  // createdAt / updatedAt — ISO string comparison
  const av = a[key] ?? ''
  const bv = b[key] ?? ''
  if (av < bv) return -1 * dir
  if (av > bv) return 1 * dir
  return 0
}

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

const visibleTickets = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  return tickets.value
    .filter((ticket) => !ticket.deletedAt)
    .filter((ticket) => (statusFilter.value ? ticket.status === statusFilter.value : true))
    .filter((ticket) => !query || ticket.title?.toLowerCase().includes(query) || ticket.description?.toLowerCase().includes(query))
    .sort(compareTickets)
})

function statusVariant(s: string): 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist' {
  const map: Record<string, 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist'> = {
    New: 'sky', Scheduled: 'violet', InProgress: 'flame',
    Done: 'mint', Invoiced: 'sky', Paid: 'mint', Canceled: 'mist'
  }
  return map[s] ?? 'mist'
}

function priorityVariant(p: string | null | undefined): 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist' {
  if (!p) return 'mist'
  const map: Record<string, 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist'> = {
    high: 'rose', medium: 'flame', low: 'mist'
  }
  return map[p.toLowerCase()] ?? 'mist'
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
    .subscribe((docs: any[]) => {
      tickets.value = docs.map((doc) => doc.toJSON())
    })
}

watch(() => locationStore.activeLocationId, subscribeToTickets, { immediate: true })

onUnmounted(() => {
  subscription?.unsubscribe()
})

const createTicket = async () => {
  const ticket = await repository.saveTicket({ status: 'New' })
  await navigateTo(`/tickets/${ticket.id}?edit=1`)
}
</script>
