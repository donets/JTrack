<template>
  <section class="space-y-6">
    <JPageHeader
      title="Quotes"
      description="Quotation workflow will be implemented after core operational views."
      :breadcrumbs="breadcrumbs"
    />

    <JEmptyState
      icon="📝"
      title="Quotes module is coming soon"
      description="Navigation entry is enabled. Quote entities and workflows are planned in deferred scope."
    />
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Quotes', to: '/quotes' }
]

setBreadcrumbs(breadcrumbs)
</script>
