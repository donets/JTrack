<template>
  <section class="space-y-6">
    <JPageHeader
      title="Dashboard"
      description="Overview widgets will be delivered in Epic Dashboard tasks."
      :breadcrumbs="breadcrumbs"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <JStatCard label="Open tickets" value="—" />
      <JStatCard label="Completed this month" value="—" />
      <JStatCard label="Revenue" value="—" />
    </div>

    <JCard title="Dashboard">
      <JEmptyState
        icon="📊"
        title="Dashboard is in progress"
        description="Core app shell is now active. Dashboard analytics widgets are planned in the next epic."
      />
    </JCard>
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', to: '/dashboard' }]

setBreadcrumbs(breadcrumbs)
</script>
