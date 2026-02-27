<template>
  <div ref="rootRef" class="relative" @keydown="handleKeydown">
    <label v-if="label" :id="labelId" class="mb-1 block text-xs font-semibold text-slate-600">
      {{ label }}
    </label>

    <button
      ref="triggerRef"
      type="button"
      :class="triggerClasses"
      :aria-haspopup="'listbox'"
      :aria-expanded="isOpen"
      :aria-labelledby="label ? labelId : undefined"
      @click="toggle"
    >
      <span v-if="selectedOption" class="truncate">
        <slot name="selected" :option="selectedOption">
          {{ selectedOption.label }}
        </slot>
      </span>
      <span v-else class="truncate text-slate-400">{{ placeholder }}</span>
      <svg
        class="ml-auto h-4 w-4 shrink-0 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>

    <Transition name="j-listbox-transition">
      <ul
        v-if="isOpen"
        ref="menuRef"
        role="listbox"
        :aria-activedescendant="activeOptionId"
        class="absolute left-0 z-40 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
      >
        <li
          v-for="(option, index) in options"
          :id="optionId(index)"
          :key="option.value"
          :ref="(el) => setItemRef(el, index)"
          role="option"
          :aria-selected="option.value === modelValue"
          :class="optionClasses(option, index)"
          @click="select(option)"
          @mouseenter="activeIndex = index"
        >
          <slot name="option" :option="option" :selected="option.value === modelValue">
            {{ option.label }}
          </slot>
          <svg
            v-if="option.value === modelValue"
            class="ml-auto h-4 w-4 shrink-0 text-emerald-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

type ListboxOption = {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: ListboxOption[]
    label?: string
    placeholder?: string
  }>(),
  {
    label: undefined,
    placeholder: 'Select…'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const id = useId()
const labelId = computed(() => `j-listbox-label-${id}`)
const activeOptionId = computed(() =>
  isOpen.value ? optionId(activeIndex.value) : undefined
)

const isOpen = ref(false)
const activeIndex = ref(0)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const itemRefs = ref<(HTMLElement | null)[]>([])

const selectedOption = computed(() =>
  props.options.find((o) => o.value === props.modelValue)
)

const triggerClasses = computed(() => [
  'flex w-full items-center gap-1 rounded-md border bg-white px-3 py-2 pr-3 text-[13px]',
  'focus:outline-none focus:ring-2 focus:ring-sky/30',
  'border-slate-200 text-ink'
])

function optionId(index: number) {
  return `j-listbox-option-${id}-${index}`
}

function optionClasses(option: ListboxOption, index: number) {
  return [
    'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
    'focus:outline-none',
    activeIndex.value === index ? 'bg-slate-100' : 'hover:bg-slate-50',
    option.value === props.modelValue ? 'font-medium' : ''
  ]
}

function setItemRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (!el) {
    itemRefs.value[index] = null
    return
  }
  if (el instanceof HTMLElement) {
    itemRefs.value[index] = el
    return
  }
  if ('$el' in el) {
    itemRefs.value[index] = (el.$el as HTMLElement | null) ?? null
    return
  }
  itemRefs.value[index] = null
}

function focusActiveItem() {
  itemRefs.value[activeIndex.value]?.scrollIntoView({ block: 'nearest' })
}

async function open() {
  if (props.options.length === 0) return
  isOpen.value = true
  const selectedIdx = props.options.findIndex((o) => o.value === props.modelValue)
  activeIndex.value = selectedIdx >= 0 ? selectedIdx : 0
  await nextTick()
  focusActiveItem()
}

function close() {
  isOpen.value = false
}

async function toggle() {
  if (isOpen.value) {
    close()
  } else {
    await open()
  }
}

function select(option: ListboxOption) {
  emit('update:modelValue', option.value)
  close()
  triggerRef.value?.focus()
}

function moveActive(delta: number) {
  const count = props.options.length
  if (count === 0) return
  activeIndex.value = (activeIndex.value + delta + count) % count
  nextTick(() => focusActiveItem())
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    open()
    return
  }

  if (!isOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    triggerRef.value?.focus()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const option = props.options[activeIndex.value]
    if (option) select(option)
  }
}

function onDocumentMouseDown(event: MouseEvent) {
  const target = event.target as Node | null
  if (!isOpen.value || !target) return
  if (!rootRef.value?.contains(target)) close()
}

watch(
  () => isOpen.value,
  (open) => {
    if (!open) itemRefs.value = []
  }
)

if (process.client) {
  document.addEventListener('mousedown', onDocumentMouseDown)
}

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('mousedown', onDocumentMouseDown)
  }
})
</script>

<style scoped>
.j-listbox-transition-enter-active,
.j-listbox-transition-leave-active {
  transition: all 0.15s ease;
}

.j-listbox-transition-enter-from,
.j-listbox-transition-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
