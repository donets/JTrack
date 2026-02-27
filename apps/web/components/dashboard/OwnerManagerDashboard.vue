<template>
  <section class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <JStatCard label="Open Jobs" :value="ownerManager.openJobs" icon="🎫" />
      <JStatCard
        label="Due Today"
        :value="ownerManager.dueToday"
        icon="⏰"
        :value-color="ownerManager.dueToday > 0 ? '#f97316' : undefined"
      />
      <JStatCard
        label="Completed (MTD)"
        :value="ownerManager.completedMtd"
        icon="✅"
        :value-color="ownerManager.completedMtd > 0 ? '#10b981' : undefined"
      />
      <JStatCard label="Revenue (MTD)" :value="ownerManager.revenueMtdLabel" icon="💶" />
    </div>

    <p class="text-xs text-slate-500">
      {{ ownerManager.dueTodayUnassigned }} of {{ ownerManager.dueToday }} jobs due today are still unassigned.
    </p>

    <div class="grid gap-4 xl:grid-cols-[2fr,1fr]">
      <div class="space-y-4">
        <JCard title="Job Status Distribution">
          <div v-if="visibleDistribution.length > 0" class="space-y-3">
            <div class="flex h-7 overflow-hidden rounded-md border border-mist-dark bg-mist">
              <div
                v-for="segment in visibleDistribution"
                :key="segment.key"
                class="flex items-center justify-center px-2 text-[11px] font-semibold text-white"
                :class="segmentBarClass(segment.variant)"
                :style="{ flexGrow: segment.count, flexBasis: '0%' }"
              >
                <span class="truncate">
                  {{ segment.label }} ({{ segment.count }})
                </span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <JBadge
                v-for="segment in ownerManager.statusDistribution"
                :key="`legend-${segment.key}`"
                :variant="segment.variant"
              >
                {{ segment.label }}: {{ segment.count }}
              </JBadge>
            </div>
          </div>
          <p v-else class="text-sm text-slate-500">No active ticket distribution available.</p>
        </JCard>

        <JCard title="Unassigned Jobs">
          <template #action>
            <JBadge variant="flame">{{ ownerManager.unassignedTickets.length }}</JBadge>
          </template>

          <JTable
            :columns="unassignedColumns"
            :rows="unassignedRows"
            empty-text="No unassigned jobs"
          >
            <template #cell-priority="{ row }">
              <JBadge :variant="row.priorityVariant">{{ row.priorityLabel }}</JBadge>
            </template>

            <template #cell-actions="{ row }">
              <NuxtLink
                :to="`/tickets/${row.id}`"
                class="text-xs font-semibold text-mint hover:underline"
              >
                Open
              </NuxtLink>
            </template>
          </JTable>
        </JCard>
      </div>

      <div class="space-y-4">
        <JCard title="Team Today">
          <div v-if="usersLoading" class="space-y-3">
            <div v-for="index in 3" :key="`member-skeleton-${index}`" class="h-10 animate-pulse rounded bg-mist" />
          </div>
          <div v-else-if="ownerManager.teamAvailability.length > 0" class="space-y-3">
            <article
              v-for="member in ownerManager.teamAvailability"
              :key="member.userId"
              class="flex items-center gap-3"
            >
              <JAvatar :name="member.name" size="sm" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-ink">{{ member.name }}</p>
                <p class="truncate text-xs text-slate-500">{{ member.detail }}</p>
              </div>
              <JBadge :variant="member.statusVariant">{{ member.statusLabel }}</JBadge>
            </article>
          </div>
          <p v-else class="text-sm text-slate-500">No technician availability data yet.</p>
        </JCard>

        <JCard title="Recent Activity">
          <JTimeline v-if="ownerManager.activityItems.length > 0" :items="ownerManager.activityItems" />
          <p v-else class="text-sm text-slate-500">Recent activity will appear after ticket updates.</p>
        </JCard>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumn } from '~/types/ui'

const { ownerManager, usersLoading } = useDashboardStats()

const unassignedColumns: TableColumn[] = [
  { key: 'ticket', label: 'Ticket' },
  { key: 'title', label: 'Title' },
  { key: 'priority', label: 'Priority' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: '', align: 'right', width: '72px' }
]

const unassignedRows = computed(() =>
  ownerManager.value.unassignedTickets.map((ticket) => ({
    id: ticket.id,
    ticket: ticket.ticketCode,
    title: ticket.title,
    priorityLabel: ticket.priorityLabel,
    priorityVariant: ticket.priorityVariant,
    created: ticket.createdLabel
  }))
)

const visibleDistribution = computed(() =>
  ownerManager.value.statusDistribution.filter((segment) => segment.count > 0)
)

const segmentBarClass = (variant: string) => {
  if (variant === 'sky') {
    return 'bg-sky'
  }

  if (variant === 'violet') {
    return 'bg-violet'
  }

  if (variant === 'flame') {
    return 'bg-flame'
  }

  if (variant === 'mint') {
    return 'bg-mint'
  }

  if (variant === 'rose') {
    return 'bg-rose'
  }

  return 'bg-slate-400'
}
</script>
