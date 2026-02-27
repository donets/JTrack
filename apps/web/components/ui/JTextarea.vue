<template>
  <label v-if="label" :for="textareaId" class="mb-1 block text-xs font-semibold text-slate-600">
    {{ label }}
  </label>

  <textarea
    :id="textareaId"
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :class="textareaClasses"
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
    rows?: number
    placeholder?: string
    error?: string
    id?: string
  }>(),
  {
    label: undefined,
    rows: 4,
    placeholder: '',
    error: undefined,
    id: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const instance = getCurrentInstance()
const textareaId = computed(() => props.id ?? `j-textarea-${instance?.uid ?? 'field'}`)

const textareaClasses = computed(() => [
  'block w-full min-w-0 rounded-md border bg-white px-3 py-2 text-[13px] text-ink',
  'resize-y placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky/30',
  props.error ? 'border-rose' : 'border-slate-200'
])

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>
