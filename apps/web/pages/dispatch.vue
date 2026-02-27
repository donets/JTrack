<template>
  <section class="space-y-4">
    <JPageHeader
      title="Dispatch"
      description="Board foundation is ready and will be expanded with scheduling interactions in upcoming tasks."
      :breadcrumbs="breadcrumbs"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <article class="rounded-xl border border-slate-200 bg-white p-4">
        <h3 class="font-semibold">New</h3>
        <p class="mt-2 text-sm text-slate-600">Incoming work orders</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-4">
        <h3 class="font-semibold">Scheduled</h3>
        <p class="mt-2 text-sm text-slate-600">Assigned and planned jobs</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-4">
        <h3 class="font-semibold">In progress</h3>
        <p class="mt-2 text-sm text-slate-600">Technician-active tickets</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Dispatch', to: '/dispatch' }
]

setBreadcrumbs(breadcrumbs)
</script>
