<template>
  <label v-if="label" :for="inputId" class="mb-1 block text-xs font-semibold text-slate-600">
    {{ label }}
  </label>

  <input
    :id="inputId"
    :type="inputType"
    :value="inputValue"
    :min="minValue"
    :max="maxValue"
    :class="inputClasses"
    @input="onInput"
  />

  <p v-if="error" class="mt-1 text-xs text-rose">
    {{ error }}
  </p>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    min?: string
    max?: string
    includeTime?: boolean
    error?: string
    id?: string
  }>(),
  {
    label: undefined,
    min: undefined,
    max: undefined,
    includeTime: false,
    error: undefined,
    id: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const instance = getCurrentInstance()
const inputId = computed(() => props.id ?? `j-date-picker-${instance?.uid ?? 'field'}`)

const inputType = computed(() => (props.includeTime ? 'datetime-local' : 'date'))

const pad = (value: number) => String(value).padStart(2, '0')

const toInputValue = (source?: string) => {
  if (!source) {
    return ''
  }

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) {
    return source
  }

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())

  if (!props.includeTime) {
    return `${year}-${month}-${day}`
  }

  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const inputValue = computed(() => toInputValue(props.modelValue))
const minValue = computed(() => toInputValue(props.min))
const maxValue = computed(() => toInputValue(props.max))

const inputClasses = computed(() => [
  'block w-full min-w-0 rounded-md border bg-white px-3 py-2 text-[13px] text-ink',
  'focus:outline-none focus:ring-2 focus:ring-sky/30',
  props.error ? 'border-rose' : 'border-slate-200'
])

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  const rawValue = target?.value ?? ''

  if (!rawValue) {
    emit('update:modelValue', '')
    return
  }

  if (!props.includeTime) {
    emit('update:modelValue', `${rawValue}T00:00:00.000Z`)
    return
  }

  const parsed = new Date(rawValue)
  emit('update:modelValue', Number.isNaN(parsed.getTime()) ? rawValue : parsed.toISOString())
}
</script>
