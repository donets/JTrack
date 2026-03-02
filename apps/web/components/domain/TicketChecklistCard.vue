<template>
  <JCard title="Checklist">
    <p class="mb-2 text-xs text-slate-500">{{ completedCount }}/{{ items.length }}</p>
    <JProgress :value="completedCount" :max="items.length || 1" variant="mint" />

    <ul v-if="items.length > 0" class="mt-3 space-y-2">
      <li v-for="item in items" :key="item.id">
        <JCheckbox
          :model-value="item.checked"
          :label="item.label"
          :disabled="disabled"
          @update:model-value="(value) => emit('toggle', { id: item.id, checked: value })"
        />
      </li>
    </ul>

    <p v-else class="mt-3 text-sm text-slate-500">No checklist items configured.</p>
  </JCard>
</template>

<script setup lang="ts">
import type { TicketChecklistItem } from '@jtrack/shared'

const props = withDefaults(
  defineProps<{
    items: TicketChecklistItem[]
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

const emit = defineEmits<{
  toggle: [payload: { id: string; checked: boolean }]
}>()

const completedCount = computed(() => props.items.filter((item) => item.checked).length)
</script>
