<template>
  <header class="rounded-lg border border-slate-200 bg-white px-4 py-3">
    <nav
      v-if="breadcrumbs.length > 0"
      class="flex flex-wrap items-center gap-1 text-xs text-slate-500"
      aria-label="Breadcrumb"
    >
      <template v-for="(crumb, index) in breadcrumbs" :key="`${crumb.label}-${index}`">
        <NuxtLink
          v-if="crumb.to && index < breadcrumbs.length - 1"
          :to="crumb.to"
          class="hover:text-slate-700"
        >
          {{ crumb.label }}
        </NuxtLink>
        <span v-else>{{ crumb.label }}</span>
        <span v-if="index < breadcrumbs.length - 1">/</span>
      </template>
    </nav>

    <div class="mt-1 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-ink"><slot name="title">{{ title }}</slot></h1>
          <slot name="status" />
        </div>
        <p v-if="description" class="mt-1 text-sm text-slate-600">
          {{ description }}
        </p>
      </div>

      <div v-if="$slots.actions" class="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

withDefaults(
  defineProps<{
    title: string
    description?: string
    breadcrumbs?: BreadcrumbItem[]
  }>(),
  {
    description: undefined,
    breadcrumbs: () => []
  }
)
</script>
