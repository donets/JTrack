<template>
  <div class="relative w-full">
    <span class="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-slate-400">
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </span>

    <input
      :value="internalValue"
      :placeholder="placeholder"
      class="block w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-9 text-[13px] text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky/30"
      type="search"
      @input="onInput"
    />

    <button
      v-if="internalValue"
      type="button"
      class="absolute inset-y-0 right-2 inline-flex items-center rounded px-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      aria-label="Clear search"
      @click="clearValue"
    >
      ✕
    </button>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    debounce?: number
  }>(),
  {
    placeholder: 'Search',
    debounce: 300
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const internalValue = ref(props.modelValue)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (value) => {
    internalValue.value = value
  }
)

const emitValue = (value: string, immediate = false) => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  if (immediate || props.debounce <= 0) {
    emit('update:modelValue', value)
    return
  }

  timer = setTimeout(() => {
    emit('update:modelValue', value)
    timer = null
  }, props.debounce)
}

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  const nextValue = target?.value ?? ''
  internalValue.value = nextValue
  emitValue(nextValue)
}

const clearValue = () => {
  internalValue.value = ''
  emitValue('', true)
}

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})
</script>
