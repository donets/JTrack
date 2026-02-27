<template>
  <svg
    :class="spinnerClasses"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" class="opacity-25" stroke="currentColor" stroke-width="3" />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      class="opacity-90"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type SpinnerSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    size?: SpinnerSize
  }>(),
  {
    size: 'md'
  }
)

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10'
}

const spinnerClasses = computed(() => [
  'inline-block animate-spin text-current',
  sizeClasses[props.size]
])
</script>
