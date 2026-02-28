<template>
  <section class="space-y-4">
    <JPageHeader
      title="Dispatch"
      description="Plan jobs, assign technicians, and keep the day schedule synchronized."
      :breadcrumbs="breadcrumbs"
    />

    <div class="rounded-xl border border-slate-200 bg-white px-3 sm:px-5">
      <JTabs
        v-model="activeTab"
        :tabs="tabItems"
        id-prefix="dispatch-tab"
        panel-id-prefix="dispatch-panel"
      />
    </div>

    <div
      v-if="activeTab === 'board'"
      id="dispatch-panel-board"
      role="tabpanel"
      aria-labelledby="dispatch-tab-board"
      class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <DispatchTimeGrid
        :date="selectedDate"
        @update:date="selectedDate = $event"
      >
        <template #default="{ date, labelWidth, hourWidth }">
          <DispatchGanttRow
            v-for="technician in technicians"
            :key="technician.id"
            :technician="technician"
            :jobs="technician.jobs"
            :date="date"
            :label-width-px="labelWidth"
            :hour-width-px="hourWidth"
            @ticket-drop="onTicketDrop"
            @open-ticket="onOpenTicket"
          />

          <div
            v-if="technicians.length === 0"
            class="px-4 py-8 text-center text-sm text-slate-500"
          >
            No active technicians found for this location.
          </div>
        </template>
      </DispatchTimeGrid>

      <DispatchUnassignedSidebar
        :tickets="unassignedTickets"
        @open-ticket="openTicket"
        @quick-assign="openQuickAssign"
      />
    </div>

    <div
      v-else-if="activeTab === 'timeline'"
      id="dispatch-panel-timeline"
      role="tabpanel"
      aria-labelledby="dispatch-tab-timeline"
      class="rounded-xl border border-slate-200 bg-white"
    >
      <header class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 class="text-sm font-semibold text-ink">Weekly Timeline</h2>
        <p class="text-xs text-slate-500">{{ weekRangeLabel }}</p>
      </header>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[880px] divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Technician
              </th>
              <th
                v-for="day in weekDates"
                :key="day"
                class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {{ formatWeekDay(day) }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="technician in weeklySchedules" :key="technician.id">
              <td class="px-4 py-3">
                <div class="inline-flex items-center gap-2">
                  <JAvatar :name="technician.name" size="sm" />
                  <span class="text-sm font-semibold text-ink">{{ technician.name }}</span>
                </div>
              </td>

              <td
                v-for="day in weekDates"
                :key="`${technician.id}-${day}`"
                class="min-w-[140px] px-3 py-3 align-top"
              >
                <div class="space-y-1">
                  <button
                    v-for="job in technician.jobsByDay[day]"
                    :key="job.id"
                    type="button"
                    class="block w-full truncate rounded-md bg-slate-100 px-2 py-1 text-left text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    @click="openTicket(job.id)"
                  >
                    {{ job.title }}
                  </button>

                  <span
                    v-if="technician.jobsByDay[day].length === 0"
                    class="text-xs text-slate-400"
                  >
                    —
                  </span>
                </div>
              </td>
            </tr>

            <tr v-if="weeklySchedules.length === 0">
              <td class="px-4 py-8 text-center text-sm text-slate-500" :colspan="weekDates.length + 1">
                No technician schedules available.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-else
      id="dispatch-panel-map"
      role="tabpanel"
      aria-labelledby="dispatch-tab-map"
      class="rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 class="text-sm font-semibold text-ink">Map</h2>
      <p class="mt-2 text-sm text-slate-600">
        Interactive dispatch map is enabled in JTR-151.
      </p>
    </div>

    <TicketQuickAssignModal
      :model-value="quickAssignOpen"
      :ticket-id="quickAssignTicketId"
      :technicians="technicianOptions"
      :submitting="quickAssignSaving"
      @update:model-value="quickAssignOpen = $event"
      @submit="submitQuickAssign"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { BreadcrumbItem, DispatchGanttRowDropPayload, QuickAssignPayload, TabItem } from '~/types/ui'

const route = useRoute()
const router = useRouter()
const { show } = useToast()
const { setBreadcrumbs } = useBreadcrumbs()
const { enforceDispatchAccess } = useDispatchAccessGuard()

type DispatchTab = 'board' | 'timeline' | 'map'
type QueryValue = string | null | (string | null)[] | undefined

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Dispatch', to: '/dispatch' }
]

setBreadcrumbs(breadcrumbs)

const tabItems: TabItem[] = [
  { key: 'board', label: 'Board' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'map', label: 'Map' }
]

const parseTab = (value: QueryValue): DispatchTab => {
  const raw = Array.isArray(value) ? value[0] : value

  if (raw === 'timeline' || raw === 'map') {
    return raw
  }

  return 'board'
}

const parseDate = (value: QueryValue) => {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw
  }
  return todayDate()
}

const activeTab = ref<DispatchTab>(parseTab(route.query.tab))
const selectedDate = ref(parseDate(route.query.date))
const quickAssignOpen = ref(false)
const quickAssignTicketId = ref('')
const quickAssignSaving = ref(false)

const {
  technicians,
  unassignedTickets,
  weekDates,
  weeklySchedules,
  technicianOptions,
  assignDroppedTicket,
  assignTicket
} = useDispatchBoard(selectedDate)

await enforceDispatchAccess()

watch(
  () => route.query.tab,
  (queryTab) => {
    const next = parseTab(queryTab)
    if (next !== activeTab.value) {
      activeTab.value = next
    }
  }
)

watch(
  () => route.query.date,
  (queryDate) => {
    const next = parseDate(queryDate)
    if (next !== selectedDate.value) {
      selectedDate.value = next
    }
  }
)

watch([activeTab, selectedDate], async () => {
  const nextQuery = {
    ...route.query,
    tab: activeTab.value,
    date: selectedDate.value
  }

  if (route.query.tab === nextQuery.tab && route.query.date === nextQuery.date) {
    return
  }

  await router.replace({ query: nextQuery })
})

const weekRangeLabel = computed(() => {
  if (weekDates.value.length === 0) {
    return ''
  }

  const first = new Date(`${weekDates.value[0]}T00:00:00`)
  const last = new Date(`${weekDates.value[weekDates.value.length - 1]}T00:00:00`)

  const start = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = last.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return `${start} - ${end}`
})

const formatWeekDay = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

const onOpenTicket = ({ ticketId }: { ticketId: string }) => {
  openTicket(ticketId)
}

const openTicket = async (ticketId: string) => {
  await navigateTo(`/tickets/${ticketId}`)
}

const onTicketDrop = async (payload: DispatchGanttRowDropPayload) => {
  try {
    await assignDroppedTicket(payload)
    show({
      type: 'success',
      message: 'Ticket scheduled successfully'
    })
  } catch {
    show({
      type: 'error',
      message: 'Failed to schedule ticket'
    })
  }
}

const openQuickAssign = (ticketId: string) => {
  quickAssignTicketId.value = ticketId
  quickAssignOpen.value = true
}

const submitQuickAssign = async (payload: QuickAssignPayload) => {
  quickAssignSaving.value = true

  try {
    await assignTicket(payload)
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
    quickAssignSaving.value = false
  }
}

function todayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>
