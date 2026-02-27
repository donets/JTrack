<template>
  <section class="space-y-6">
    <JPageHeader
      title="Team"
      description="Manage members, roles, and location access."
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <JButton v-if="showInviteAction" variant="primary" @click="inviteModalOpen = true">
          + Invite Member
        </JButton>
      </template>
    </JPageHeader>

    <JCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <JTabs
            v-model="sectionTab"
            :tabs="sectionTabs"
            id-prefix="team-section-tabs"
            panel-id-prefix="team-section-panel"
            class="sm:max-w-[360px]"
          />
          <div class="sm:w-[280px]">
            <JSearchInput
              v-model="searchQuery"
              :placeholder="sectionTab === 'members' ? 'Search by name or email' : 'Search invitations'"
            />
          </div>
        </div>

        <div
          v-if="sectionTab === 'members'"
          id="team-section-panel-members"
          role="tabpanel"
          aria-labelledby="team-section-tabs-members"
          class="space-y-4"
        >
          <JTabs
            v-model="memberFilterTab"
            :tabs="memberFilterTabs"
            id-prefix="team-member-filter-tabs"
            panel-id-prefix="team-member-filter-panel"
            class="sm:max-w-[360px]"
          />

          <div
            :id="`team-member-filter-panel-${memberFilterTab}`"
            role="tabpanel"
            :aria-labelledby="`team-member-filter-tabs-${memberFilterTab}`"
          >
            <JTable
              :columns="memberColumns"
              :rows="memberRows"
              :loading="teamStore.loading"
              empty-text="No team members found"
            >
              <template #cell-member="{ row }">
                <div class="flex items-center gap-3">
                  <JAvatar :name="row.name" size="sm" />
                  <div class="min-w-0">
                    <NuxtLink
                      :to="`/team/${row.id}`"
                      class="block truncate font-semibold text-ink hover:text-mint hover:underline"
                    >
                      {{ row.name }}
                    </NuxtLink>
                    <p class="truncate text-xs text-slate-500">{{ row.email }}</p>
                  </div>
                </div>
              </template>

              <template #cell-role="{ row }">
                <JBadge :variant="roleBadgeVariant(row.role)">{{ row.role }}</JBadge>
              </template>

              <template #cell-status="{ row }">
                <JBadge :variant="membershipStatusBadgeVariant(row.membershipStatus)">
                  {{ row.statusLabel }}
                </JBadge>
              </template>
            </JTable>
          </div>
        </div>

        <div
          v-else-if="sectionTab === 'invitations'"
          id="team-section-panel-invitations"
          role="tabpanel"
          aria-labelledby="team-section-tabs-invitations"
        >
          <JTable
            :columns="invitationColumns"
            :rows="invitationRows"
            :loading="teamStore.loading"
            empty-text="No pending invitations"
          >
            <template #cell-role="{ row }">
              <JBadge :variant="roleBadgeVariant(row.role)">{{ row.role }}</JBadge>
            </template>

            <template #cell-status="{ row }">
              <JBadge :variant="membershipStatusBadgeVariant(row.membershipStatus)">
                {{ row.status }}
              </JBadge>
            </template>

            <template #cell-actions="{ row }">
              <div class="flex items-center justify-end gap-3 text-xs">
                <button
                  class="font-semibold text-sky hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="inviteActionEmail === row.email"
                  @click="resendInvite(row.email)"
                >
                  <span v-if="inviteActionEmail === row.email">Working...</span>
                  <span v-else>Resend</span>
                </button>
                <button
                  class="font-semibold text-rose-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="inviteActionEmail === row.email"
                  @click="revokeInvite(row.id, row.email)"
                >
                  <span v-if="inviteActionEmail === row.email">Working...</span>
                  <span v-else>Revoke</span>
                </button>
              </div>
            </template>
          </JTable>
        </div>

        <div
          v-else
          id="team-section-panel-roles"
          role="tabpanel"
          aria-labelledby="team-section-tabs-roles"
        >
          <JTable
            :columns="matrixColumns"
            :rows="matrixRows"
            empty-text="No role privileges configured"
          >
            <template #cell-privilege="{ row }">
              <span class="font-mono text-xs text-ink">{{ row.privilege }}</span>
            </template>

            <template #cell-owner="{ row }">
              <span
                :class="matrixValueClass(row.owner)"
                :aria-label="row.owner ? 'Owner has privilege' : 'Owner does not have privilege'"
              >
                {{ row.owner ? '✓' : '—' }}
              </span>
            </template>

            <template #cell-manager="{ row }">
              <span
                :class="matrixValueClass(row.manager)"
                :aria-label="row.manager ? 'Manager has privilege' : 'Manager does not have privilege'"
              >
                {{ row.manager ? '✓' : '—' }}
              </span>
            </template>

            <template #cell-technician="{ row }">
              <span
                :class="matrixValueClass(row.technician)"
                :aria-label="row.technician ? 'Technician has privilege' : 'Technician does not have privilege'"
              >
                {{ row.technician ? '✓' : '—' }}
              </span>
            </template>
          </JTable>
        </div>
      </div>
    </JCard>

    <InviteMemberModal
      v-if="canInviteMembers"
      v-model="inviteModalOpen"
      @invited="onInvited"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { privilegeKeys, rolePrivileges, type PrivilegeKey, type RoleKey, type Ticket } from '@jtrack/shared'
import type { BreadcrumbItem, TableColumn, TabItem } from '~/types/ui'
import {
  formatMembershipStatus,
  membershipStatusBadgeVariant,
  roleBadgeVariant
} from '~/utils/teamDisplay'

const teamStore = useTeamStore()
const locationStore = useLocationStore()
const db = useRxdb()
const { hasPrivilege } = useRbacGuard()
const { show } = useToast()
const { setBreadcrumbs } = useBreadcrumbs()
const { enforceReadAccess } = useTeamAccessGuard()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Team', to: '/team' }
]

setBreadcrumbs(breadcrumbs)

const memberColumns: TableColumn[] = [
  { key: 'member', label: 'Member' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'jobsMtd', label: 'Jobs (MTD)', align: 'center', width: '110px' },
  { key: 'lastActive', label: 'Last Active' }
]

const invitationColumns: TableColumn[] = [
  { key: 'email', label: 'Email' },
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'invitedDate', label: 'Invited Date' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'right', width: '140px' }
]

const matrixColumns: TableColumn[] = [
  { key: 'privilege', label: 'Privilege', rowHeader: true },
  { key: 'owner', label: 'Owner', align: 'center', width: '110px' },
  { key: 'manager', label: 'Manager', align: 'center', width: '110px' },
  { key: 'technician', label: 'Technician', align: 'center', width: '110px' }
]

const sectionTab = ref<'members' | 'invitations' | 'roles'>('members')
const memberFilterTab = ref<'all' | 'active' | 'invited'>('all')
const searchQuery = ref('')
const inviteModalOpen = ref(false)
const inviteActionEmail = ref<string | null>(null)
const locationTickets = ref<Ticket[]>([])

type RxSubscription = { unsubscribe: () => void }
let ticketsSubscription: RxSubscription | null = null

const canInviteMembers = computed(() => hasPrivilege('users.manage'))
const showInviteAction = computed(() => canInviteMembers.value && sectionTab.value !== 'roles')

const sectionTabs = computed<TabItem[]>(() => [
  { key: 'members', label: 'Members', count: teamStore.members.length },
  {
    key: 'invitations',
    label: 'Invitations',
    count: teamStore.members.filter((member) => member.membershipStatus === 'invited').length
  },
  { key: 'roles', label: 'Roles' }
])

const memberFilterTabs = computed<TabItem[]>(() => [
  { key: 'all', label: 'All', count: teamStore.members.length },
  {
    key: 'active',
    label: 'Active',
    count: teamStore.members.filter((member) => member.membershipStatus === 'active').length
  },
  {
    key: 'invited',
    label: 'Invited',
    count: teamStore.members.filter((member) => member.membershipStatus === 'invited').length
  }
])

const isCurrentMonth = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

const jobsMtdByMember = computed(() => {
  const counts = new Map<string, number>()

  for (const ticket of locationTickets.value) {
    if (!ticket.assignedToUserId || !isCurrentMonth(ticket.updatedAt)) {
      continue
    }

    counts.set(ticket.assignedToUserId, (counts.get(ticket.assignedToUserId) ?? 0) + 1)
  }

  return counts
})

const filteredMembers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return teamStore.members
    .filter((member) => {
      if (memberFilterTab.value === 'all') {
        return true
      }

      return member.membershipStatus === memberFilterTab.value
    })
    .filter((member) => {
      if (!query) {
        return true
      }

      return member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)
    })
})

const memberRows = computed(() =>
  filteredMembers.value.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    membershipStatus: member.membershipStatus,
    statusLabel: formatMembershipStatus(member.membershipStatus),
    jobsMtd: jobsMtdByMember.value.get(member.id) ?? 0,
    lastActive: new Date(member.updatedAt).toLocaleDateString()
  }))
)

const invitationRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return teamStore.members
    .filter((member) => member.membershipStatus === 'invited')
    .filter((member) => {
      if (!query) {
        return true
      }

      return member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)
    })
    .map((member) => ({
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      membershipStatus: member.membershipStatus,
      invitedDate: new Date(member.updatedAt).toLocaleDateString(),
      status: formatMembershipStatus(member.membershipStatus)
    }))
})

const matrixRows = computed(() =>
  privilegeKeys.map((privilege) => ({
    id: privilege,
    privilege,
    owner: hasRolePrivilege('Owner', privilege),
    manager: hasRolePrivilege('Manager', privilege),
    technician: hasRolePrivilege('Technician', privilege)
  }))
)

const hasRolePrivilege = (role: RoleKey, privilege: PrivilegeKey) =>
  rolePrivileges[role].includes(privilege)

const matrixValueClass = (granted: boolean) =>
  granted ? 'text-sm font-semibold text-mint' : 'text-sm text-slate-400'

const clearTicketSubscription = () => {
  ticketsSubscription?.unsubscribe()
  ticketsSubscription = null
}

const subscribeToTickets = () => {
  clearTicketSubscription()

  if (!locationStore.activeLocationId) {
    locationTickets.value = []
    return
  }

  ticketsSubscription = db.collections.tickets
    .find({
      selector: {
        locationId: locationStore.activeLocationId,
        deletedAt: null
      }
    })
    .$
    .subscribe((docs: any[]) => {
      locationTickets.value = docs.map((doc) => doc.toJSON() as Ticket)
    })
}

const loadMembers = async () => {
  if (!locationStore.activeLocationId || !hasPrivilege('users.read')) {
    teamStore.members = []
    return
  }

  try {
    await teamStore.fetchMembers()
  } catch {
    show({
      type: 'error',
      message: teamStore.error ?? 'Failed to load team members'
    })
  }
}

const onInvited = () => {
  sectionTab.value = 'invitations'
  searchQuery.value = ''
}

const resendInvite = async (email: string) => {
  if (inviteActionEmail.value) {
    return
  }

  if (!window.confirm(`Resend invite to ${email}?`)) {
    return
  }

  inviteActionEmail.value = email

  try {
    // Backend resend endpoint is not available yet.
    show({
      type: 'info',
      message: `Resend invite for ${email} is queued for backend support`
    })
  } finally {
    inviteActionEmail.value = null
  }
}

const revokeInvite = async (userId: string, email: string) => {
  if (inviteActionEmail.value) {
    return
  }

  if (!window.confirm(`Revoke pending invite for ${email}?`)) {
    return
  }

  inviteActionEmail.value = email

  try {
    await teamStore.removeMember(userId)
    show({
      type: 'success',
      message: `Invite revoked for ${email}`
    })
  } catch {
    show({
      type: 'error',
      message: teamStore.error ?? `Failed to revoke invite for ${email}`
    })
  } finally {
    inviteActionEmail.value = null
  }
}

onMounted(() => {
  void enforceReadAccess().then((allowed) => {
    if (allowed) {
      void loadMembers()
      subscribeToTickets()
    }
  })
})

watch(() => locationStore.activeLocationId, () => {
  void enforceReadAccess().then((allowed) => {
    if (allowed) {
      void loadMembers()
      subscribeToTickets()
    } else {
      clearTicketSubscription()
      locationTickets.value = []
    }
  })
})

watch(sectionTab, (value) => {
  searchQuery.value = ''

  if (value !== 'members') {
    memberFilterTab.value = 'all'
  }
})

onUnmounted(() => {
  clearTicketSubscription()
})
</script>
