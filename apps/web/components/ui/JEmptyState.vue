<template>
  <section class="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-10 text-center">
    <p v-if="icon" class="mb-3 text-4xl leading-none">{{ icon }}</p>
    <h3 class="text-lg font-semibold text-ink">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-md text-sm text-slate-600">
      {{ description }}
    </p>

    <div v-if="action" class="mt-5">
      <NuxtLink
        v-if="action.to && !action.onClick"
        :to="action.to"
        class="inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent bg-mint px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-mint/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
      >
        {{ action.label }}
      </NuxtLink>

      <JButton
        v-else
        type="button"
        variant="primary"
        @click="handleAction"
      >
        {{ action.label }}
      </JButton>
    </div>
  </section>
</template>

<script setup lang="ts">
type EmptyStateAction = {
  label: string
  to?: string
  onClick?: () => void | Promise<void>
}

const props = defineProps<{
  title: string
  description?: string
  icon?: string
  action?: EmptyStateAction
}>()

const handleAction = async () => {
  await props.action?.onClick?.()
}
</script>
