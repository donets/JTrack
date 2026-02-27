<template>
  <section class="space-y-6">
    <JPageHeader
      :title="pageTitle"
      :description="pageDescription"
      :breadcrumbs="breadcrumbs"
    >
      <template #status>
        <JBadge variant="mist" size="sm">{{ todayLabel }}</JBadge>
      </template>
    </JPageHeader>

    <OwnerManagerDashboard v-if="activeRole === 'Owner' || activeRole === 'Manager'" />
    <TechnicianDashboard v-else-if="activeRole === 'Technician'" />

    <JEmptyState
      v-else
      icon="🧭"
      title="Select an active location"
      description="Dashboard widgets become available once role context is resolved for a location."
    />
  </section>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import type { BreadcrumbItem } from '~/types/ui'

const { activeRole } = useRbacGuard()
const { setBreadcrumbs } = useBreadcrumbs()

const pageTitle = computed(() => (activeRole.value === 'Technician' ? 'My Day' : 'Dashboard'))
const pageDescription = computed(() =>
  activeRole.value === 'Technician'
    ? 'Your jobs and schedule for today.'
    : 'Operational overview for the active location.'
)

const breadcrumbs = computed<BreadcrumbItem[]>(() => [{ label: pageTitle.value, to: '/dashboard' }])

watchEffect(() => {
  setBreadcrumbs(breadcrumbs.value)
})

const todayLabel = computed(() =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
)
</script>
