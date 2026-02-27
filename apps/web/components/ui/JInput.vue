<template>
  <div>
    <label v-if="label" :for="inputId" class="mb-1 block text-xs font-semibold text-slate-600">
      {{ label }}
    </label>

    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :class="inputClasses"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined"
      @input="onInput"
    />

    <p v-if="error" :id="errorId" class="mt-1 text-xs text-rose">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

type InputType = 'text' | 'email' | 'password' | 'number'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    error?: string
    type?: InputType
    id?: string
  }>(),
  {
    label: undefined,
    placeholder: '',
    error: undefined,
    type: 'text',
    id: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const generatedId = useId()
const inputId = computed(() => props.id ?? `j-input-${generatedId}`)
const errorId = computed(() => `${inputId.value}-error`)

const inputClasses = computed(() => [
  'block w-full min-w-0 rounded-md border bg-white px-3 py-2 text-[13px] text-ink',
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky/30',
  props.error ? 'border-rose' : 'border-slate-200'
])

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>
