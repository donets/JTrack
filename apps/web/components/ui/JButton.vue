<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading"
    :class="buttonClasses"
  >
    <span v-if="loading" class="inline-flex items-center">
      <svg
        class="h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          class="opacity-25"
          stroke="currentColor"
          stroke-width="3"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          class="opacity-90"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    </span>

    <span v-else-if="$slots.icon" class="inline-flex items-center">
      <slot name="icon" />
    </span>

    <span class="inline-flex items-center">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonType = 'button' | 'submit' | 'reset'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    disabled?: boolean
    type?: ButtonType
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button'
  }
)

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-mint text-white hover:bg-mint/90',
  secondary: 'border border-slate-200 bg-white text-ink hover:bg-mist',
  ghost: 'bg-transparent text-ink hover:bg-mist',
  danger: 'bg-rose text-white hover:bg-rose/90'
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-2 text-[13px]',
  lg: 'px-4 py-2.5 text-sm'
}

const isDisabled = computed(() => props.disabled || props.loading)

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent font-semibold transition-colors',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky/40',
  'disabled:cursor-not-allowed disabled:opacity-60',
  variantClasses[props.variant],
  sizeClasses[props.size]
])
</script>
