<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header
      v-if="hasHeader"
      class="flex items-center justify-between border-b border-slate-200 px-4 py-3"
    >
      <h3 v-if="title" class="text-[13px] font-semibold text-ink">
        {{ title }}
      </h3>

      <div v-if="$slots.action" class="inline-flex items-center">
        <slot name="action" />
      </div>
    </header>

    <div :class="bodyClasses">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    padding?: boolean
  }>(),
  {
    title: undefined,
    padding: true
  }
)

const slots = useSlots()

const hasHeader = computed(() => Boolean(props.title) || Boolean(slots.action))

const bodyClasses = computed(() => (props.padding ? 'p-4' : ''))
</script>
