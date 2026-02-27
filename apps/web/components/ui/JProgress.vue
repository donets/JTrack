<template>
  <div class="h-2 w-full overflow-hidden rounded bg-slate-200" role="progressbar" :aria-valuenow="normalizedValue" :aria-valuemin="0" :aria-valuemax="max">
    <div :class="fillClasses" :style="fillStyle" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ProgressVariant = 'mint' | 'flame' | 'sky'

const props = withDefaults(
  defineProps<{
    value: number
    max?: number
    variant?: ProgressVariant
  }>(),
  {
    max: 100,
    variant: 'mint'
  }
)

const normalizedValue = computed(() => {
  const maxValue = props.max > 0 ? props.max : 100
  return Math.min(Math.max(props.value, 0), maxValue)
})

const percent = computed(() => {
  if (props.max <= 0) {
    return 0
  }

  return (normalizedValue.value / props.max) * 100
})

const fillClasses = computed(() => [
  'h-full transition-all duration-200',
  props.variant === 'flame' ? 'bg-flame' : props.variant === 'sky' ? 'bg-sky' : 'bg-mint'
])

const fillStyle = computed(() => ({
  width: `${percent.value}%`
}))
</script>
