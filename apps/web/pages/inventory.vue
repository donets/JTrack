<template>
  <section class="space-y-6">
    <JPageHeader
      title="Inventory"
      description="Inventory screens are not in current MVP scope and remain planned."
      :breadcrumbs="breadcrumbs"
    />

    <JEmptyState
      icon="📦"
      title="Inventory module is coming soon"
      description="App shell includes the route and navigation entry; inventory workflows will be added later."
    />
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Inventory', to: '/inventory' }
]

setBreadcrumbs(breadcrumbs)
</script>
