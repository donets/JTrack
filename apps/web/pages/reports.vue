<template>
  <section class="space-y-6">
    <JPageHeader
      title="Reports"
      description="Analytics and reporting page shell is ready for chart implementation in future tasks."
      :breadcrumbs="breadcrumbs"
    />

    <JEmptyState
      icon="📈"
      title="Reports module is coming soon"
      description="This navigation route is prepared for the analytics epic."
    />
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Reports', to: '/reports' }
]

setBreadcrumbs(breadcrumbs)
</script>
