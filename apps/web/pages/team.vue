<template>
  <section class="space-y-6">
    <JPageHeader
      title="Team"
      description="Team management entrypoint is ready for member list and role-management tasks."
      :breadcrumbs="breadcrumbs"
    />

    <JEmptyState
      icon="👤"
      title="Team module is coming soon"
      description="Route scaffolding is complete. Team list, invite flow, and member detail will be added in Epic Team."
    />
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Team', to: '/team' }
]

setBreadcrumbs(breadcrumbs)
</script>
