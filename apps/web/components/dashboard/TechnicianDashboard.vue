<template>
  <section class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-3">
      <JStatCard label="My Jobs Today" :value="technician.jobsToday" icon="🛠" />
      <JStatCard
        label="Completed"
        :value="technician.completed"
        icon="✅"
        :value-color="technician.completed > 0 ? '#10b981' : undefined"
      />
      <JStatCard
        label="Remaining"
        :value="technician.remaining"
        icon="📌"
        :value-color="technician.remaining > 0 ? '#f97316' : undefined"
      />
    </div>

    <JCard title="Next Job">
      <article
        v-if="technician.nextJob"
        class="rounded-lg border border-flame/40 border-l-4 border-l-flame bg-flame-light/40 p-4"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="text-xs font-semibold uppercase tracking-[0.5px] text-flame">Next Job</p>
          <JBadge :variant="technician.nextJob.statusVariant">{{ technician.nextJob.statusLabel }}</JBadge>
        </div>

        <h3 class="text-base font-semibold text-ink">
          {{ technician.nextJob.ticketCode }} {{ technician.nextJob.title }}
        </h3>

        <p class="mt-2 text-sm text-slate-600">
          📍 {{ technician.nextJob.locationLabel }} • ⏰ {{ technician.nextJob.timeLabel }}
        </p>

        <p v-if="technician.nextJob.description" class="mt-3 text-sm text-slate-700">
          {{ technician.nextJob.description }}
        </p>

        <div class="mt-4 flex flex-wrap gap-2">
          <JButton
            variant="primary"
            size="sm"
            :loading="startingJob"
            :disabled="technician.nextJob.status === 'InProgress'"
            @click="startNextJob"
          >
            {{ technician.nextJob.status === 'InProgress' ? 'In Progress' : 'Start Job' }}
          </JButton>
          <NuxtLink :to="`/tickets/${technician.nextJob.id}`">
            <JButton variant="secondary" size="sm">Open Ticket</JButton>
          </NuxtLink>
          <NuxtLink to="/tickets">
            <JButton variant="secondary" size="sm">All Jobs</JButton>
          </NuxtLink>
        </div>
      </article>

      <p v-else class="text-sm text-slate-500">No upcoming jobs for today.</p>
    </JCard>

    <JCard title="Today's Schedule">
      <template v-if="technician.schedule.length > 0">
        <JTable
          :columns="scheduleColumns"
          :rows="scheduleRows"
          empty-text="No jobs scheduled for today"
        >
          <template #cell-job="{ row }">
            <NuxtLink
              :to="`/tickets/${row.id}`"
              class="font-semibold text-ink hover:text-mint hover:underline"
            >
              {{ row.job }}
            </NuxtLink>
          </template>

          <template #cell-status="{ row }">
            <JBadge :variant="row.statusVariant">{{ row.statusLabel }}</JBadge>
          </template>
        </JTable>
      </template>

      <JEmptyState
        v-else
        icon="📅"
        title="No jobs planned for today"
        description="New assignments will appear here once dispatch is scheduled."
      />
    </JCard>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TableColumn } from '~/types/ui'

const { technician } = useDashboardStats()
const repository = useOfflineRepository()
const syncStore = useSyncStore()

const startingJob = ref(false)

const scheduleColumns: TableColumn[] = [
  { key: 'time', label: 'Time', width: '140px' },
  { key: 'job', label: 'Job' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status', align: 'right', width: '120px' }
]

const scheduleRows = computed(() =>
  technician.value.schedule.map((ticket) => ({
    id: ticket.id,
    time: ticket.timeLabel,
    job: `${ticket.ticketCode} ${ticket.title}`,
    location: ticket.locationLabel,
    statusLabel: ticket.statusLabel,
    statusVariant: ticket.statusVariant
  }))
)

const startNextJob = async () => {
  const nextJob = technician.value.nextJob
  if (!nextJob || nextJob.status === 'InProgress') {
    return
  }

  startingJob.value = true

  try {
    await repository.saveTicket({
      id: nextJob.id,
      status: 'InProgress'
    })
    await syncStore.syncNow()
  } finally {
    startingJob.value = false
  }
}
</script>
