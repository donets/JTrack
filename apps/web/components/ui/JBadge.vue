<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type BadgeVariant = 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist'
type BadgeSize = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant
    size?: BadgeSize
  }>(),
  {
    variant: 'mist',
    size: 'md'
  }
)

const variantClasses: Record<BadgeVariant, string> = {
  mint: 'bg-mint-light text-emerald-800',
  flame: 'bg-flame-light text-orange-800',
  sky: 'bg-sky-light text-blue-800',
  rose: 'bg-rose-light text-rose-800',
  violet: 'bg-violet-light text-violet-800',
  mist: 'bg-mist-dark text-ink-light'
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-[11px]'
}

const badgeClasses = computed(() => [
  'inline-flex items-center rounded-full font-semibold uppercase leading-none tracking-[0.5px]',
  variantClasses[props.variant],
  sizeClasses[props.size]
])
</script>
