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

    <JCard title="Technician View">
      <article class="rounded-lg border border-mist-dark bg-slate-50/70 p-4">
        <h2 class="text-sm font-semibold text-ink">My Day (Coming Next)</h2>
        <p class="mt-2 text-sm text-slate-600">
          The technician-focused "My Day" dashboard is implemented in the next Epic Dashboard task.
        </p>
      </article>
    </JCard>
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
