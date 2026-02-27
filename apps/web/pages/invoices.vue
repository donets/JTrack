<template>
  <section class="space-y-6">
    <JPageHeader
      title="Invoices"
      description="Financial invoice view is scaffolded and ready for upcoming implementation tasks."
      :breadcrumbs="breadcrumbs"
    />

    <JEmptyState
      icon="💰"
      title="Invoices module is coming soon"
      description="This route is available from app shell. Invoice listing and payment flows follow in later tasks."
    />
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Invoices', to: '/invoices' }
]

setBreadcrumbs(breadcrumbs)
</script>
