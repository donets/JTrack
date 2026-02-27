<template>
  <div :class="skeletonClasses" :style="skeletonStyle" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

type SkeletonVariant = 'text' | 'circle' | 'rect'

const props = withDefaults(
  defineProps<{
    variant?: SkeletonVariant
    width?: string | number
    height?: string | number
  }>(),
  {
    variant: 'rect',
    width: undefined,
    height: undefined
  }
)

const toCssSize = (value?: string | number) => {
  if (value === undefined) {
    return undefined
  }

  return typeof value === 'number' ? `${value}px` : value
}

const defaultSizes: Record<SkeletonVariant, { width: string; height: string }> = {
  text: { width: '100%', height: '14px' },
  circle: { width: '40px', height: '40px' },
  rect: { width: '100%', height: '16px' }
}

const skeletonStyle = computed(() => {
  const defaultSize = defaultSizes[props.variant]
  const width = toCssSize(props.width) ?? defaultSize.width
  const height = toCssSize(props.height) ?? (props.variant === 'circle' ? width : defaultSize.height)

  return {
    width,
    height
  }
})

const skeletonClasses = computed(() => [
  'animate-pulse bg-slate-200',
  props.variant === 'circle' ? 'rounded-full' : 'rounded'
])
</script>
