<template>
  <span :class="avatarClasses">
    <img
      v-if="showImage"
      :src="src"
      :alt="name"
      class="h-full w-full object-cover"
      @error="onImageError"
    />

    <span v-else>{{ initials }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type AvatarSize = 'sm' | 'md' | 'lg'
type AvatarPalette = 'sky' | 'mint' | 'violet' | 'flame'

const props = withDefaults(
  defineProps<{
    name: string
    src?: string
    size?: AvatarSize
  }>(),
  {
    src: undefined,
    size: 'md'
  }
)

const imageFailed = ref(false)

watch(
  () => props.src,
  () => {
    imageFailed.value = false
  }
)

const showImage = computed(() => Boolean(props.src) && !imageFailed.value)

const initials = computed(() => {
  const normalized = props.name.trim()
  if (!normalized) {
    return '?'
  }

  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0] ?? ''}${words[words.length - 1][0] ?? ''}`.toUpperCase()
})

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-14 w-14 text-xl'
}

const paletteOrder: AvatarPalette[] = ['sky', 'mint', 'violet', 'flame']

const paletteClasses: Record<AvatarPalette, string> = {
  sky: 'bg-sky-light text-sky',
  mint: 'bg-mint-light text-mint',
  violet: 'bg-violet-light text-violet',
  flame: 'bg-flame-light text-flame'
}

const palette = computed<AvatarPalette>(() => {
  let hash = 0
  for (const char of props.name) {
    hash = (hash << 5) - hash + char.charCodeAt(0)
    hash |= 0
  }

  return paletteOrder[Math.abs(hash) % paletteOrder.length]
})

const avatarClasses = computed(() => [
  'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold',
  sizeClasses[props.size],
  showImage.value ? 'bg-slate-100 text-transparent' : paletteClasses[palette.value]
])

const onImageError = () => {
  imageFailed.value = true
}
</script>
