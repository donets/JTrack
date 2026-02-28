<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="close"
    >
      <div
        ref="dialogRef"
        :class="dialogClasses"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Dialog'"
        tabindex="-1"
      >
        <header v-if="title" class="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-ink">
          {{ title }}
        </header>

        <section class="px-5 py-5">
          <slot />
        </section>

        <footer v-if="$slots.footer" class="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

type ModalSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    size?: ModalSize
  }>(),
  {
    title: undefined,
    size: 'md'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const dialogRef = ref<HTMLElement | null>(null)
let previousActiveElement: HTMLElement | null = null

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-[min(400px,90vw)]',
  md: 'max-w-[min(520px,90vw)]',
  lg: 'max-w-[min(700px,90vw)]'
}

const dialogClasses = computed(() => [
  'w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl',
  sizeClasses[props.size]
])

const close = () => {
  emit('update:modelValue', false)
}

const getFocusableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((node) => !node.hasAttribute('disabled') && node.tabIndex !== -1)

const focusDialog = async () => {
  await nextTick()
  const container = dialogRef.value
  if (!container) {
    return
  }

  const focusable = getFocusableElements(container)
  if (focusable.length > 0) {
    focusable[0]?.focus()
    return
  }

  container.focus()
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.modelValue) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key !== 'Tab') {
    return
  }

  const container = dialogRef.value
  if (!container) {
    return
  }

  const focusable = getFocusableElements(container)
  if (focusable.length === 0) {
    event.preventDefault()
    container.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const current = document.activeElement as HTMLElement | null

  if (event.shiftKey && current === first) {
    event.preventDefault()
    last?.focus()
    return
  }

  if (!event.shiftKey && current === last) {
    event.preventDefault()
    first?.focus()
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      previousActiveElement = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', handleKeyDown)
      await focusDialog()
      return
    }

    document.removeEventListener('keydown', handleKeyDown)
    previousActiveElement?.focus()
    previousActiveElement = null
  }
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>
