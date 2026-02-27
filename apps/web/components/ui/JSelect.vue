<template>
  <div>
    <label v-if="label" :for="selectId" class="mb-1 block text-xs font-semibold text-slate-600">
      {{ label }}
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :class="selectClasses"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : undefined"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled>
          {{ placeholder }}
        </option>

        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </span>
    </div>

    <p v-if="error" :id="errorId" class="mt-1 text-xs text-rose">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

type SelectOption = {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    label?: string
    placeholder?: string
    error?: string
    id?: string
  }>(),
  {
    label: undefined,
    placeholder: '',
    error: undefined,
    id: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const generatedId = useId()
const selectId = computed(() => props.id ?? `j-select-${generatedId}`)
const errorId = computed(() => `${selectId.value}-error`)

const selectClasses = computed(() => [
  'block w-full appearance-none rounded-md border bg-white px-3 py-2 pr-9 text-[13px]',
  'focus:outline-none focus:ring-2 focus:ring-sky/30',
  props.modelValue ? 'text-ink' : 'text-slate-400',
  props.error ? 'border-rose' : 'border-slate-200'
])

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>
