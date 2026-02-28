<template>
  <div class="flex border-b-2 border-slate-200" role="tablist" aria-orientation="horizontal">
    <button
      v-for="(tab, index) in tabs"
      :id="tabId(tab.key)"
      :key="tab.key"
      :ref="(element) => setTabRef(element, index)"
      type="button"
      role="tab"
      :aria-selected="tab.key === modelValue"
      :aria-controls="tabPanelId(tab.key)"
      :tabindex="tab.key === modelValue ? 0 : -1"
      :class="tabClasses(tab.key)"
      @click="selectTab(tab.key)"
      @keydown="onKeydown($event, index)"
    >
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.count !== undefined"
        class="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { TabItem } from '~/types/ui'

const props = defineProps<{
  tabs: TabItem[]
  modelValue: string
  idPrefix?: string
  panelIdPrefix?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const tabsId = useId()
const tabRefs = ref<(HTMLButtonElement | null)[]>([])
const tabIdBase = computed(() => props.idPrefix ?? `j-tab-${tabsId}`)

const selectTab = (key: string) => {
  if (key === props.modelValue) {
    return
  }

  emit('update:modelValue', key)
}

const tabId = (key: string) => `${tabIdBase.value}-${key}`
const tabPanelId = (key: string) =>
  props.panelIdPrefix ? `${props.panelIdPrefix}-${key}` : undefined

const setTabRef = (element: Element | ComponentPublicInstance | null, index: number) => {
  if (!element) {
    tabRefs.value[index] = null
    return
  }

  if (element instanceof HTMLButtonElement) {
    tabRefs.value[index] = element
    return
  }

  if ('$el' in element) {
    tabRefs.value[index] = element.$el instanceof HTMLButtonElement ? element.$el : null
    return
  }

  tabRefs.value[index] = null
}

const moveFocus = async (index: number) => {
  const tab = props.tabs[index]
  if (!tab) {
    return
  }

  selectTab(tab.key)
  await nextTick()
  tabRefs.value[index]?.focus()
}

const onKeydown = async (event: KeyboardEvent, index: number) => {
  if (props.tabs.length === 0) {
    return
  }

  const lastIndex = props.tabs.length - 1

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    await moveFocus(index === lastIndex ? 0 : index + 1)
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    await moveFocus(index === 0 ? lastIndex : index - 1)
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    await moveFocus(0)
    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    await moveFocus(lastIndex)
  }
}

const tabClasses = (key: string) => [
  'inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold transition-colors',
  key === props.modelValue
    ? 'border-mint text-mint'
    : 'border-transparent text-slate-500 hover:text-slate-700'
]
</script>
