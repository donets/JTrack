<template>
  <section class="space-y-6">
    <JPageHeader
      title="Customers"
      description="Customer management screens are planned in a later epic."
      :breadcrumbs="breadcrumbs"
    />

    <JEmptyState
      icon="👥"
      title="Customers module is coming soon"
      description="App shell navigation is ready. Customer and site entities will be delivered in deferred tasks."
    />
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Customers', to: '/customers' }
]

setBreadcrumbs(breadcrumbs)
</script>
