<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      <TransitionGroup
        name="j-toast-transition"
        tag="div"
        class="flex flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <article
          v-for="toast in toasts"
          :key="toast.id"
          :class="toastClasses(toast.type)"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          aria-atomic="true"
        >
          <p class="flex-1 pr-2 text-sm">{{ toast.message }}</p>
          <button
            class="inline-flex h-7 w-7 items-center justify-center rounded text-[12px] leading-none hover:bg-black/5"
            type="button"
            aria-label="Dismiss notification"
            @click="dismiss(toast.id)"
          >
            ✕
          </button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ToastType } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

const baseClasses =
  'pointer-events-auto flex items-start rounded-md border px-3 py-2 shadow-sm backdrop-blur'

const toneClasses: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-mint-light text-emerald-900',
  error: 'border-rose-200 bg-rose-light text-rose-900',
  warning: 'border-orange-200 bg-flame-light text-orange-900',
  info: 'border-sky-200 bg-sky-light text-blue-900'
}

const toastClasses = (type: ToastType) => `${baseClasses} ${toneClasses[type]}`
</script>

<style scoped>
.j-toast-transition-enter-active,
.j-toast-transition-leave-active {
  transition: all 0.2s ease;
}

.j-toast-transition-enter-from,
.j-toast-transition-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
