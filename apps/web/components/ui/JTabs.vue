<template>
  <div class="flex border-b-2 border-slate-200">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      :class="tabClasses(tab.key)"
      @click="selectTab(tab.key)"
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
type TabItem = {
  key: string
  label: string
  count?: number
}

const props = defineProps<{
  tabs: TabItem[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectTab = (key: string) => {
  if (key === props.modelValue) {
    return
  }

  emit('update:modelValue', key)
}

const tabClasses = (key: string) => [
  'inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold transition-colors',
  key === props.modelValue
    ? 'border-mint text-mint'
    : 'border-transparent text-slate-500 hover:text-slate-700'
]
</script>
