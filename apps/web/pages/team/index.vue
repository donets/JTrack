<template>
  <section class="space-y-6">
    <JPageHeader
      title="Team"
      description="Manage members, roles, and location access."
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <JButton v-if="canInviteMembers" variant="primary" @click="inviteModalOpen = true">
          + Invite Member
        </JButton>
      </template>
    </JPageHeader>

    <JCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <JTabs v-model="activeTab" :tabs="teamTabs" class="sm:max-w-[360px]" />
          <div class="sm:w-[280px]">
            <JSearchInput
              v-model="searchQuery"
              placeholder="Search by name or email"
            />
          </div>
        </div>

        <JTable
          :columns="columns"
          :rows="rows"
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
      </div>
    </JCard>

    <InviteMemberModal
      v-if="canInviteMembers"
      v-model="inviteModalOpen"
      @invited="activeTab = 'invited'"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { RoleKey, UserLocationStatus } from '@jtrack/shared'
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

const columns: TableColumn[] = [
  { key: 'member', label: 'Member' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'lastActive', label: 'Last Active' }
]

const activeTab = ref<'all' | 'active' | 'invited'>('all')
const searchQuery = ref('')
const inviteModalOpen = ref(false)
const accessRedirected = ref(false)

const canInviteMembers = computed(() => hasPrivilege('users.manage'))

const teamTabs = computed<TabItem[]>(() => [
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
      if (activeTab.value === 'all') {
        return true
      }

      return member.membershipStatus === activeTab.value
    })
    .filter((member) => {
      if (!query) {
        return true
      }

      return member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)
    })
})

const rows = computed(() =>
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
