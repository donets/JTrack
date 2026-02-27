<template>
  <div ref="rootRef" class="relative inline-block text-left" @keydown="handleKeydown">
    <div
      ref="triggerRef"
      class="inline-flex"
      aria-haspopup="menu"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-controls="isOpen ? menuId : undefined"
      @click="toggleMenu"
    >
      <slot name="trigger" :open="openMenu" :close="closeMenu" :toggle="toggleMenu" :is-open="isOpen" />
    </div>

    <Transition name="j-dropdown-transition">
      <div
        v-if="isOpen"
        :id="menuId"
        ref="menuRef"
        :class="menuClasses"
        role="menu"
      >
        <button
          v-for="(item, index) in items"
          :key="`${item.label}-${index}`"
          :ref="(element) => setItemRef(element, index)"
          type="button"
          role="menuitem"
          :class="itemClasses(item, index)"
          @click="selectItem(index)"
          @mouseenter="activeIndex = index"
        >
          <span v-if="item.icon" class="text-base leading-none">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { DropdownItem } from '~/types/ui'

const props = withDefaults(
  defineProps<{
    items: DropdownItem[]
    align?: 'left' | 'right'
  }>(),
  {
    align: 'left'
  }
)

const isOpen = ref(false)
const activeIndex = ref(0)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const itemRefs = ref<(HTMLElement | null)[]>([])
const menuId = `j-dropdown-${useId()}`

const menuClasses = computed(() => [
  'absolute z-40 mt-2 min-w-[180px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg',
  props.align === 'right' ? 'right-0' : 'left-0'
])

const openMenu = async () => {
  if (props.items.length === 0) {
    return
  }

  isOpen.value = true
  activeIndex.value = 0
  await nextTick()
  focusActiveItem()
}

const closeMenu = () => {
  isOpen.value = false
}

const toggleMenu = async () => {
  if (isOpen.value) {
    closeMenu()
    return
  }

  await openMenu()
}

const setItemRef = (
  element: Element | ComponentPublicInstance | null,
  index: number
) => {
  if (!element) {
    itemRefs.value[index] = null
    return
  }

  if (element instanceof HTMLElement) {
    itemRefs.value[index] = element
    return
  }

  if ('$el' in element) {
    itemRefs.value[index] = (element.$el as HTMLElement | null) ?? null
    return
  }

  itemRefs.value[index] = null
}

const focusActiveItem = () => {
  const element = itemRefs.value[activeIndex.value]
  element?.focus()
}

const focusTrigger = () => {
  const triggerElement =
    triggerRef.value?.querySelector<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"]), input, select, textarea'
    ) ?? triggerRef.value
  triggerElement?.focus()
}

const selectItem = async (index: number) => {
  const item = props.items[index]
  if (!item) {
    return
  }

  closeMenu()
  await item.action?.()
}

const moveActive = (delta: number) => {
  const count = props.items.length
  if (count === 0) {
    return
  }

  activeIndex.value = (activeIndex.value + delta + count) % count
  nextTick(() => focusActiveItem())
}

const handleKeydown = async (event: KeyboardEvent) => {
  if (!isOpen.value && ['ArrowDown', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    await openMenu()
    return
  }

  if (!isOpen.value) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu()
    focusTrigger()
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

  if (event.key === 'Enter') {
    event.preventDefault()
    await selectItem(activeIndex.value)
  }
}

const onDocumentMouseDown = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!isOpen.value || !target) {
    return
  }

  if (!rootRef.value?.contains(target)) {
    closeMenu()
  }
}

watch(
  () => isOpen.value,
  (open) => {
    if (!open) {
      itemRefs.value = []
    }
  }
)

const itemClasses = (item: DropdownItem, index: number) => [
  'flex w-full items-center gap-2 px-3 py-2 text-sm',
  'focus:outline-none',
  activeIndex.value === index ? 'bg-slate-100 text-ink' : 'text-slate-700 hover:bg-slate-50',
  item.variant === 'danger' ? 'text-rose-700 hover:bg-rose-50' : ''
]

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
.j-dropdown-transition-enter-active,
.j-dropdown-transition-leave-active {
  transition: all 0.15s ease;
}

.j-dropdown-transition-enter-from,
.j-dropdown-transition-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
