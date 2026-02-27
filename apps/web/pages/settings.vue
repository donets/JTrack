<template>
  <section class="space-y-6">
    <JPageHeader
      title="Settings"
      description="Workspace settings shell is available for upcoming management features."
      :breadcrumbs="breadcrumbs"
    />

    <JEmptyState
      icon="⚙️"
      title="Settings module is coming soon"
      description="The page route is active; settings content is planned for a later milestone."
    />
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Settings', to: '/settings' }
]

setBreadcrumbs(breadcrumbs)
</script>
