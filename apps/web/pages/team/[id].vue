<template>
  <section class="space-y-6">
    <JPageHeader
      :title="member ? member.name : 'Team member'"
      description="Member profile, workload, and role management."
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <JButton
          v-if="member && canManageSettings"
          variant="secondary"
          :disabled="lifecycleUpdating"
          :loading="lifecycleUpdating"
          @click="toggleMembershipStatus"
        >
          {{ member.membershipStatus === 'suspended' ? 'Activate' : 'Suspend' }}
        </JButton>
        <JButton
          v-if="member && canManageSettings"
          variant="danger"
          :disabled="lifecycleUpdating"
          :loading="lifecycleUpdating"
          @click="removeMember"
        >
          Remove
        </JButton>
      </template>
    </JPageHeader>

    <JEmptyState
      v-if="!member && !teamStore.loading"
      icon="👤"
      title="Member not found"
      description="The requested member does not exist in this location."
      :action="{ label: 'Back to Team', to: '/team' }"
    />

    <div v-else class="grid gap-4 xl:grid-cols-[2fr,1fr]">
      <JCard>
        <div class="space-y-4">
          <JTabs
            v-model="activeTab"
            :tabs="detailTabs"
            id-prefix="team-member-detail-tabs"
            panel-id-prefix="team-member-detail-panel"
            class="max-w-[380px]"
          />

          <div
            v-if="activeTab === 'jobs'"
            id="team-member-detail-panel-jobs"
            role="tabpanel"
            aria-labelledby="team-member-detail-tabs-jobs"
          >
            <JTable
              :columns="jobColumns"
              :rows="jobRows"
              empty-text="No assigned jobs yet"
            >
              <template #cell-ticket="{ row }">
                <NuxtLink :to="`/tickets/${row.id}`" class="font-semibold text-mint hover:underline">
                  {{ row.ticket }}
                </NuxtLink>
              </template>

              <template #cell-status="{ row }">
                <JBadge :variant="ticketStatusVariant(row.status)">{{ row.status }}</JBadge>
              </template>
            </JTable>
          </div>

          <div
            v-else-if="activeTab === 'schedule'"
            id="team-member-detail-panel-schedule"
            role="tabpanel"
            aria-labelledby="team-member-detail-tabs-schedule"
          >
            <JTable
              :columns="scheduleColumns"
              :rows="scheduleRows"
              empty-text="No scheduled jobs"
            >
              <template #cell-ticket="{ row }">
                <NuxtLink :to="`/tickets/${row.id}`" class="font-semibold text-mint hover:underline">
                  {{ row.ticket }}
                </NuxtLink>
              </template>

              <template #cell-status="{ row }">
                <JBadge :variant="ticketStatusVariant(row.status)">{{ row.status }}</JBadge>
              </template>
            </JTable>
          </div>

          <div
            v-else
            id="team-member-detail-panel-timeLog"
            role="tabpanel"
            aria-labelledby="team-member-detail-tabs-timeLog"
          >
            <JTimeline v-if="activityItems.length > 0" :items="activityItems" />
            <p v-else class="text-sm text-slate-500">No recent activity for this member.</p>
          </div>
        </div>
      </JCard>

      <JCard>
        <div v-if="member" class="space-y-4">
          <div class="flex items-center gap-3">
            <JAvatar :name="member.name" size="lg" />
            <div>
              <p class="text-lg font-semibold text-ink">{{ member.name }}</p>
              <p class="text-sm text-slate-500">{{ member.email }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <JBadge :variant="roleBadgeVariant(member.role)">{{ member.role }}</JBadge>
            <JBadge :variant="membershipStatusBadgeVariant(member.membershipStatus)">
              {{ formatMembershipStatus(member.membershipStatus) }}
            </JBadge>
          </div>

          <div class="grid grid-cols-3 gap-2 rounded-md bg-mist p-3 text-center">
            <div>
              <p class="text-xs text-slate-500">Jobs completed</p>
              <p class="mt-1 text-sm font-semibold text-ink">{{ completedJobsCount }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">Avg rating</p>
              <p class="mt-1 text-sm font-semibold text-ink">—</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">Active since</p>
              <p class="mt-1 text-sm font-semibold text-ink">{{ activeSinceLabel }}</p>
            </div>
          </div>

          <div v-if="canManageSettings" class="space-y-3 rounded-md border border-slate-200 p-3">
            <JSelect
              v-model="selectedRole"
              label="Role"
              :options="roleOptions"
            />

            <JSelect
              v-model="selectedStatus"
              label="Status"
              :options="statusOptions"
            />

            <JButton
              variant="secondary"
              :disabled="!hasSettingsChanges || settingsUpdating"
              :loading="settingsUpdating"
              @click="saveMemberSettings"
            >
              Save Settings
            </JButton>
          </div>
        </div>
      </JCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import type { RoleKey, Ticket, UserLocationStatus } from '@jtrack/shared'
import type { BreadcrumbItem, TableColumn, TabItem, TimelineItem } from '~/types/ui'
import {
  formatMembershipStatus,
  membershipStatusBadgeVariant,
  roleBadgeVariant
} from '~/utils/teamDisplay'

type LocalComment = {
  id: string
  body: string
  createdAt: string
}

const route = useRoute()
const teamStore = useTeamStore()
const authStore = useAuthStore()
const locationStore = useLocationStore()
const db = useRxdb()
const { activeRole, hasPrivilege } = useRbacGuard()
const { show } = useToast()
const { setBreadcrumbs } = useBreadcrumbs()
const { enforceReadAccess } = useTeamAccessGuard()

const memberId = computed(() => String(route.params.id ?? ''))
const member = computed(() => teamStore.members.find((item) => item.id === memberId.value) ?? null)

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Team', to: '/team' },
  { label: member.value?.name ?? 'Member' }
])

watchEffect(() => {
  setBreadcrumbs(breadcrumbs.value)
})

const activeTab = ref<'jobs' | 'schedule' | 'timeLog'>('jobs')
const selectedRole = ref<RoleKey>('Technician')
const selectedStatus = ref<UserLocationStatus>('active')
const settingsUpdating = ref(false)
const lifecycleUpdating = ref(false)
const assignedTickets = ref<Ticket[]>([])
const activityItems = ref<TimelineItem[]>([])

const detailTabs = computed<TabItem[]>(() => [
  { key: 'jobs', label: 'Jobs', count: jobRows.value.length },
  { key: 'schedule', label: 'Schedule', count: scheduleRows.value.length },
  { key: 'timeLog', label: 'Time Log', count: activityItems.value.length }
])

const jobColumns: TableColumn[] = [
  { key: 'ticket', label: 'Ticket' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' }
]

const scheduleColumns: TableColumn[] = [
  { key: 'ticket', label: 'Ticket' },
  { key: 'title', label: 'Title' },
  { key: 'scheduledAt', label: 'Scheduled At' },
  { key: 'status', label: 'Status' }
]

const roleOptions = [
  { value: 'Owner', label: 'Owner' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Technician', label: 'Technician' }
]

const statusOptions = computed(() => {
  const options = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' }
  ]

  if (member.value?.membershipStatus === 'invited') {
    options.unshift({ value: 'invited', label: 'Invited' })
  }

  return options
})

const canManageSettings = computed(
  () =>
    (authStore.user?.isAdmin || activeRole.value === 'Owner') &&
    hasPrivilege('users.manage')
)

const hasSettingsChanges = computed(
  () =>
    Boolean(member.value) &&
    (selectedRole.value !== member.value?.role || selectedStatus.value !== member.value?.membershipStatus)
)

const jobRows = computed(() =>
  assignedTickets.value.map((ticket) => ({
    id: ticket.id,
    ticket: `#${ticket.id.slice(0, 6).toUpperCase()}`,
    title: ticket.title,
    status: ticket.status,
    date: ticket.scheduledStartAt
      ? new Date(ticket.scheduledStartAt).toLocaleString()
      : new Date(ticket.updatedAt).toLocaleDateString()
  }))
)

const scheduleRows = computed(() =>
  assignedTickets.value
    .filter((ticket) => ticket.scheduledStartAt)
    .map((ticket) => ({
      id: ticket.id,
      ticket: `#${ticket.id.slice(0, 6).toUpperCase()}`,
      title: ticket.title,
      status: ticket.status,
      scheduledAt: ticket.scheduledStartAt
        ? new Date(ticket.scheduledStartAt).toLocaleString()
        : '—'
    }))
)

const completedJobsCount = computed(
  () =>
    assignedTickets.value.filter((ticket) =>
      ['Done', 'Invoiced', 'Paid'].includes(ticket.status)
    ).length
)

const activeSinceLabel = computed(() => {
  if (!member.value) {
    return '—'
  }

  return new Date(member.value.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric'
  })
})

const ticketStatusVariant = (status: string) => {
  if (status === 'Done' || status === 'Paid') {
    return 'mint'
  }

  if (status === 'InProgress' || status === 'Scheduled') {
    return 'sky'
  }

  if (status === 'Canceled') {
    return 'rose'
  }

  return 'mist'
}

const loadMemberData = async () => {
  if (!locationStore.activeLocationId || !hasPrivilege('users.read')) {
    return
  }

  if (teamStore.members.length === 0) {
    try {
      await teamStore.fetchMembers()
    } catch {
      show({
        type: 'error',
        message: teamStore.error ?? 'Failed to load team members'
      })
    }
  }
}

type RxSubscription = { unsubscribe: () => void }
let ticketsSubscription: RxSubscription | null = null
let commentsSubscription: RxSubscription | null = null

const clearSubscriptions = () => {
  ticketsSubscription?.unsubscribe()
  commentsSubscription?.unsubscribe()
  ticketsSubscription = null
  commentsSubscription = null
}

const subscribeToMemberData = () => {
  clearSubscriptions()

  if (!locationStore.activeLocationId || !memberId.value || !hasPrivilege('users.read')) {
    assignedTickets.value = []
    activityItems.value = []
    return
  }

  ticketsSubscription = db.collections.tickets
    .find({
      selector: {
        locationId: locationStore.activeLocationId,
        assignedToUserId: memberId.value,
        deletedAt: null
      }
    })
    .$
    .subscribe((docs: Array<{ toJSON: () => Ticket }>) => {
      const tickets = docs
        .map((doc) => doc.toJSON())
        .sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1))

      assignedTickets.value = tickets
      const statusActivity = tickets.slice(0, 5).map((ticket) => ({
        id: `status-${ticket.id}-${ticket.updatedAt}`,
        type: 'status_change' as const,
        actor: {
          name: member.value?.name ?? 'Member'
        },
        content: `${ticket.title} is currently ${ticket.status}`,
        timestamp: ticket.updatedAt
      }))

      activityItems.value = [...statusActivity, ...activityItems.value.filter((item) => item.type === 'comment')]
        .sort((left, right) => (left.timestamp < right.timestamp ? 1 : -1))
        .slice(0, 10)
    })

  commentsSubscription = db.collections.ticketComments
    .find({
      selector: {
        locationId: locationStore.activeLocationId,
        authorUserId: memberId.value,
        deletedAt: null
      }
    })
    .$
    .subscribe((docs: Array<{ toJSON: () => LocalComment }>) => {
      const comments = docs.map((doc) => doc.toJSON())
      const commentItems = comments.map((comment) => ({
        id: `comment-${comment.id}`,
        type: 'comment' as const,
        actor: {
          name: member.value?.name ?? 'Member'
        },
        content: comment.body,
        timestamp: comment.createdAt
      }))

      activityItems.value = [...activityItems.value.filter((item) => item.type !== 'comment'), ...commentItems]
        .sort((left, right) => (left.timestamp < right.timestamp ? 1 : -1))
        .slice(0, 10)
    })
}

const saveMemberSettings = async () => {
  if (!member.value || !hasSettingsChanges.value) {
    return
  }

  settingsUpdating.value = true

  try {
    await teamStore.updateMemberAccess(member.value.id, {
      role: selectedRole.value,
      membershipStatus: selectedStatus.value
    })
    show({
      type: 'success',
      message: `${member.value.name}'s settings were updated`
    })
  } catch {
    show({
      type: 'error',
      message: teamStore.error ?? 'Failed to update member settings'
    })
  } finally {
    settingsUpdating.value = false
  }
}

const toggleMembershipStatus = async () => {
  if (!member.value) {
    return
  }

  const targetStatus: UserLocationStatus =
    member.value.membershipStatus === 'suspended' ? 'active' : 'suspended'

  const confirmed = window.confirm(
    `${targetStatus === 'suspended' ? 'Suspend' : 'Activate'} ${member.value.name}?`
  )

  if (!confirmed) {
    return
  }

  lifecycleUpdating.value = true

  try {
    await teamStore.updateMemberStatus(member.value.id, targetStatus)
    show({
      type: 'success',
      message: `${member.value.name} is now ${formatMembershipStatus(targetStatus).toLowerCase()}`
    })
  } catch {
    show({
      type: 'error',
      message: teamStore.error ?? 'Failed to update member status'
    })
  } finally {
    lifecycleUpdating.value = false
  }
}

const removeMember = async () => {
  if (!member.value) {
    return
  }

  if (!window.confirm(`Remove ${member.value.name} from the team?`)) {
    return
  }

  lifecycleUpdating.value = true

  try {
    await teamStore.removeMember(member.value.id)
    show({
      type: 'success',
      message: `${member.value.name} was removed`
    })
    await navigateTo('/team')
  } catch {
    show({
      type: 'error',
      message: teamStore.error ?? 'Failed to remove member'
    })
  } finally {
    lifecycleUpdating.value = false
  }
}

watch(
  member,
  (currentMember) => {
    if (!currentMember) {
      return
    }

    selectedRole.value = currentMember.role
    selectedStatus.value = currentMember.membershipStatus
  },
  { immediate: true }
)

watch(
  () => [locationStore.activeLocationId, memberId.value],
  () => {
    void enforceReadAccess().then((allowed) => {
      if (allowed) {
        subscribeToMemberData()
      } else {
        clearSubscriptions()
      }
    })
  },
  { immediate: true }
)

onMounted(() => {
  void enforceReadAccess().then((allowed) => {
    if (allowed) {
      void loadMemberData()
    }
  })
})

onUnmounted(() => {
  clearSubscriptions()
})
</script>
