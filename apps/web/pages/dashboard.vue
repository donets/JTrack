<template>
  <section class="space-y-6">
    <JPageHeader
      title="Dashboard"
      description="Operational overview for the active location."
      :breadcrumbs="breadcrumbs"
    >
      <template #status>
        <JBadge variant="mist" size="sm">{{ todayLabel }}</JBadge>
      </template>
    </JPageHeader>

    <OwnerManagerDashboard />
    <TechnicianDashboard />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', to: '/dashboard' }]

setBreadcrumbs(breadcrumbs)

const todayLabel = computed(() =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
)
</script>
