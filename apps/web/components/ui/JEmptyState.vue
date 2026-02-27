<template>
  <section class="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-10 text-center">
    <p v-if="icon" class="mb-3 text-4xl leading-none">{{ icon }}</p>
    <h3 class="text-lg font-semibold text-ink">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-md text-sm text-slate-600">
      {{ description }}
    </p>

    <div v-if="action" class="mt-5">
      <JButton
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
  if (!props.action) {
    return
  }

  if (props.action.onClick) {
    await props.action.onClick()
    return
  }

  if (props.action.to) {
    await navigateTo(props.action.to)
  }
}
</script>
