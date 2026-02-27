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
          <JTabs v-model="sectionTab" :tabs="sectionTabs" class="sm:max-w-[360px]" />
          <div class="sm:w-[280px]">
            <JSearchInput
              v-model="searchQuery"
              :placeholder="sectionTab === 'members' ? 'Search by name or email' : 'Search invitations'"
            />
          </div>
        </div>

        <template v-if="sectionTab === 'members'">
          <JTabs v-model="memberFilterTab" :tabs="memberFilterTabs" class="sm:max-w-[360px]" />

          <JTable
            :columns="memberColumns"
            :rows="memberRows"
            :loading="teamStore.loading"
            empty-text="No team members found"
          >
            <template #cell-member="{ row }">
              <div class="flex items-center gap-3">
                <JAvatar :name="row.name" size="sm" />
                <NuxtLink :to="`/team/${row.id}`" class="font-semibold text-ink hover:text-mint hover:underline">
                  {{ row.name }}
                </NuxtLink>
              </div>
            </template>

            <template #cell-role="{ row }">
              <JBadge :variant="roleBadgeVariant(row.role)">{{ row.role }}</JBadge>
            </template>

            <template #cell-status="{ row }">
              <JBadge :variant="statusBadgeVariant(row.membershipStatus)">
                {{ row.statusLabel }}
              </JBadge>
            </template>
          </JTable>
        </template>

        <JTable
          v-else-if="sectionTab === 'invitations'"
          :columns="invitationColumns"
          :rows="invitationRows"
          :loading="teamStore.loading"
          empty-text="No pending invitations"
        >
          <template #cell-role="{ row }">
            <JBadge :variant="roleBadgeVariant(row.role)">{{ row.role }}</JBadge>
          </template>

          <template #cell-status="{ row }">
            <JBadge variant="sky">{{ row.status }}</JBadge>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex items-center justify-end gap-3 text-xs">
              <button class="font-semibold text-sky hover:underline" @click="resendInvite(row.email)">
                Resend
              </button>
              <button class="font-semibold text-rose-700 hover:underline" @click="revokeInvite(row.email)">
                Revoke
              </button>
            </div>
          </template>
        </JTable>

        <div v-else class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Privilege
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <JBadge variant="violet">Owner</JBadge>
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <JBadge variant="sky">Manager</JBadge>
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <JBadge variant="mint">Technician</JBadge>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="privilege in privilegeRows" :key="privilege">
                <td class="px-4 py-2 font-mono text-xs text-ink">{{ privilege }}</td>
                <td class="px-4 py-2 text-center">
                  <span :class="matrixValueClass(hasRolePrivilege('Owner', privilege))">
                    {{ hasRolePrivilege('Owner', privilege) ? '✓' : '—' }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center">
                  <span :class="matrixValueClass(hasRolePrivilege('Manager', privilege))">
                    {{ hasRolePrivilege('Manager', privilege) ? '✓' : '—' }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center">
                  <span :class="matrixValueClass(hasRolePrivilege('Technician', privilege))">
                    {{ hasRolePrivilege('Technician', privilege) ? '✓' : '—' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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
import { computed, onMounted, ref, watch } from 'vue'
import { privilegeKeys, rolePrivileges, type PrivilegeKey, type RoleKey, type UserLocationStatus } from '@jtrack/shared'
import type { BreadcrumbItem, TableColumn, TabItem } from '~/types/ui'

const teamStore = useTeamStore()
const locationStore = useLocationStore()
const { hasPrivilege } = useRbacGuard()
const { show } = useToast()
const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Team', to: '/team' }
]

setBreadcrumbs(breadcrumbs)

const memberColumns: TableColumn[] = [
  { key: 'member', label: 'Member' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'lastActive', label: 'Last Active' }
]

const invitationColumns: TableColumn[] = [
  { key: 'email', label: 'Email' },
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'invitedDate', label: 'Invited Date' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'right', width: '120px' }
]

const sectionTab = ref<'members' | 'invitations' | 'roles'>('members')
const memberFilterTab = ref<'all' | 'active' | 'invited'>('all')
const searchQuery = ref('')
const inviteModalOpen = ref(false)
const accessRedirected = ref(false)

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

const formatMemberStatus = (status: UserLocationStatus) => {
  if (status === 'active') {
    return 'Active'
  }

  if (status === 'invited') {
    return 'Invited'
  }

  return 'Suspended'
}

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
    statusLabel: formatMemberStatus(member.membershipStatus),
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
      invitedDate: new Date(member.updatedAt).toLocaleDateString(),
      status: 'Pending'
    }))
})

const privilegeRows = privilegeKeys

const roleBadgeVariant = (role: RoleKey) => {
  if (role === 'Owner') {
    return 'violet'
  }

  if (role === 'Manager') {
    return 'sky'
  }

  return 'mint'
}

const statusBadgeVariant = (status: UserLocationStatus) => {
  if (status === 'active') {
    return 'mint'
  }

  if (status === 'invited') {
    return 'sky'
  }

  return 'flame'
}

const onInvited = () => {
  sectionTab.value = 'invitations'
  memberFilterTab.value = 'invited'
}

const resendInvite = (email: string) => {
  show({
    type: 'info',
    message: `Resend invite for ${email} is queued for backend support`
  })
}

const revokeInvite = (email: string) => {
  show({
    type: 'warning',
    message: `Revoke invite for ${email} is not implemented yet`
  })
}

const hasRolePrivilege = (role: RoleKey, privilege: PrivilegeKey) =>
  rolePrivileges[role].includes(privilege)

const matrixValueClass = (granted: boolean) =>
  granted ? 'text-sm font-semibold text-mint' : 'text-sm text-slate-400'

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

onMounted(() => {
  void enforceReadAccess().then((allowed) => {
    if (allowed) {
      void loadMembers()
    }
  })
})

watch(() => locationStore.activeLocationId, () => {
  void enforceReadAccess().then((allowed) => {
    if (allowed) {
      void loadMembers()
    }
  })
})

watch(sectionTab, (value) => {
  searchQuery.value = ''

  if (value !== 'members') {
    memberFilterTab.value = 'all'
  }
})

const enforceReadAccess = async () => {
  if (!locationStore.activeLocationId) {
    return false
  }

  if (hasPrivilege('users.read')) {
    return true
  }

  if (accessRedirected.value) {
    return false
  }

  accessRedirected.value = true
  show({
    type: 'warning',
    message: 'You do not have permission to view team pages'
  })

  await navigateTo('/dashboard')
  return false
}
</script>
