<template>
  <section class="space-y-6">
    <JPageHeader
      :title="member ? member.name : 'Team member'"
      description="Member profile, workload, and role management."
      :breadcrumbs="breadcrumbs"
    />

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
          <JTabs v-model="activeTab" :tabs="detailTabs" class="max-w-[320px]" />

          <JTable
            v-if="activeTab === 'jobs'"
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

          <div v-else>
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
            <JBadge :variant="member.membershipStatus === 'active' ? 'mint' : 'flame'">
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

          <div v-if="canManageRole" class="space-y-2 rounded-md border border-slate-200 p-3">
            <JSelect
              v-model="selectedRole"
              label="Role"
              :options="roleOptions"
            />
            <JButton
              variant="secondary"
              :disabled="selectedRole === member.role || roleUpdating"
              :loading="roleUpdating"
              @click="updateRole"
            >
              Save Role
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

const route = useRoute()
const teamStore = useTeamStore()
const authStore = useAuthStore()
const locationStore = useLocationStore()
const db = useRxdb()
const { activeRole, hasPrivilege } = useRbacGuard()
const { show } = useToast()
const { setBreadcrumbs } = useBreadcrumbs()

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

const activeTab = ref<'jobs' | 'activity'>('jobs')
const selectedRole = ref<RoleKey>('Technician')
const roleUpdating = ref(false)
const assignedTickets = ref<Ticket[]>([])
const activityItems = ref<TimelineItem[]>([])

const detailTabs: TabItem[] = [
  { key: 'jobs', label: 'Jobs' },
  { key: 'activity', label: 'Activity' }
]

const jobColumns: TableColumn[] = [
  { key: 'ticket', label: 'Ticket' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' }
]

const roleOptions = [
  { value: 'Owner', label: 'Owner' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Technician', label: 'Technician' }
]

const canManageRole = computed(
  () =>
    (authStore.user?.isAdmin || activeRole.value === 'Owner') &&
    hasPrivilege('users.manage')
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

const formatMembershipStatus = (status: UserLocationStatus) => {
  if (status === 'active') {
    return 'Active'
  }

  if (status === 'invited') {
    return 'Invited'
  }

  return 'Suspended'
}

const roleBadgeVariant = (role: RoleKey) => {
  if (role === 'Owner') {
    return 'violet'
  }

  if (role === 'Manager') {
    return 'sky'
  }

  return 'mint'
}

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
  if (!locationStore.activeLocationId) {
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

let ticketsSubscription: any = null
let commentsSubscription: any = null

const clearSubscriptions = () => {
  ticketsSubscription?.unsubscribe()
  commentsSubscription?.unsubscribe()
  ticketsSubscription = null
  commentsSubscription = null
}

const subscribeToMemberData = () => {
  clearSubscriptions()

  if (!locationStore.activeLocationId || !memberId.value) {
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
    .subscribe((docs: any[]) => {
      const tickets = docs
        .map((doc) => doc.toJSON() as Ticket)
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
    .subscribe((docs: any[]) => {
      const comments = docs.map((doc) => doc.toJSON())
      const commentItems = comments.map((comment: any) => ({
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

const updateRole = async () => {
  if (!member.value || selectedRole.value === member.value.role) {
    return
  }

  roleUpdating.value = true

  try {
    await teamStore.updateMemberRole(member.value.id, selectedRole.value)
    show({
      type: 'success',
      message: `${member.value.name}'s role updated to ${selectedRole.value}`
    })
  } catch {
    show({
      type: 'error',
      message: teamStore.error ?? 'Failed to update role'
    })
  } finally {
    roleUpdating.value = false
  }
}

watch(
  member,
  (currentMember) => {
    if (!currentMember) {
      return
    }

    selectedRole.value = currentMember.role
  },
  { immediate: true }
)

watch(
  () => [locationStore.activeLocationId, memberId.value],
  () => {
    subscribeToMemberData()
  },
  { immediate: true }
)

onMounted(() => {
  void loadMemberData()
})

onUnmounted(() => {
  clearSubscriptions()
})
</script>
