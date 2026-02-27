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

    <JCard title="Dashboard Views">
      <div class="grid gap-4 lg:grid-cols-2">
        <article class="rounded-lg border border-mist-dark bg-slate-50/70 p-4">
          <h2 class="text-sm font-semibold text-ink">Owner / Manager View</h2>
          <p class="mt-2 text-sm text-slate-600">
            KPI cards, status distribution, unassigned tickets, team availability, and recent activity.
          </p>
        </article>

        <article class="rounded-lg border border-mist-dark bg-slate-50/70 p-4">
          <h2 class="text-sm font-semibold text-ink">Technician View</h2>
          <p class="mt-2 text-sm text-slate-600">
            "My Day" widgets with next job focus and today schedule for the current technician.
          </p>
        </article>
      </div>
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
