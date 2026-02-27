<template>
  <label :for="inputId" class="inline-flex items-center gap-2">
    <span class="relative inline-flex h-4 w-4 items-center justify-center">
      <input
        :id="inputId"
        :checked="modelValue"
        :disabled="disabled"
        class="peer sr-only"
        type="checkbox"
        @change="onChange"
      />
      <span
        class="h-4 w-4 rounded border border-slate-300 bg-white transition-colors peer-checked:border-mint peer-checked:bg-mint peer-focus-visible:ring-2 peer-focus-visible:ring-sky/40 peer-focus-visible:ring-offset-1 peer-disabled:opacity-60"
      />
      <svg
        class="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>

    <span v-if="label" class="text-sm text-ink">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    id?: string
    disabled?: boolean
  }>(),
  {
    label: undefined,
    id: undefined,
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const generatedId = useId()
const inputId = computed(() => props.id ?? `j-checkbox-${generatedId}`)

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', Boolean(target?.checked))
}
</script>
