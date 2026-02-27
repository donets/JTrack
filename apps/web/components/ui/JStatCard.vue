<template>
  <article class="rounded-lg border border-slate-200 bg-white p-4">
    <div class="flex items-start justify-between gap-3">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {{ label }}
      </p>
      <span v-if="icon" class="text-lg leading-none text-slate-400">{{ icon }}</span>
    </div>

    <p class="mt-2 text-3xl font-bold leading-tight" :style="valueStyle">
      {{ value }}
    </p>

    <p
      v-if="trend"
      class="mt-2 text-xs font-semibold"
      :class="trend.direction === 'up' ? 'text-mint' : 'text-rose'"
    >
      {{ trend.direction === 'up' ? '↑' : '↓' }} {{ Math.abs(trend.value) }}%
    </p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Trend = {
  value: number
  direction: 'up' | 'down'
}

const props = defineProps<{
  label: string
  value: string | number
  trend?: Trend
  icon?: string
  valueColor?: string
}>()

const valueStyle = computed(() => {
  if (!props.valueColor) {
    return undefined
  }

  return {
    color: props.valueColor
  }
})
</script>
