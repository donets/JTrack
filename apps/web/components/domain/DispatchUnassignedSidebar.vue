<template>
  <aside class="rounded-xl border border-slate-200 bg-white">
    <header class="flex items-center justify-between border-b border-slate-200 px-3 py-3">
      <div class="inline-flex items-center gap-2">
        <h3 class="text-sm font-semibold text-ink">Unassigned</h3>
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {{ tickets.length }}
        </span>
      </div>

      <button
        type="button"
        class="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 md:hidden"
        @click="toggleCollapsed"
      >
        {{ isCollapsed ? 'Show' : 'Hide' }}
      </button>
    </header>

    <div class="space-y-3 p-3" :class="isCollapsed ? 'hidden md:block' : ''">
      <JSearchInput v-model="searchQuery" placeholder="Search unassigned…" />

      <div class="max-h-[560px] space-y-2 overflow-y-auto">
        <TicketKanbanCard
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          :ticket="ticket"
          :show-ticket-code="true"
          @drag-start="emit('drag-start', $event)"
          @open-ticket="emit('open-ticket', $event)"
          @quick-assign="emit('quick-assign', $event)"
        />

        <p
          v-if="filteredTickets.length === 0"
          class="rounded-md border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-500"
        >
          No unassigned tickets
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { KanbanTicketCardItem } from '~/types/ui'

const props = defineProps<{
  tickets: KanbanTicketCardItem[]
  collapsed?: boolean
}>()

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
  'drag-start': [payload: { ticketId: string }]
  'open-ticket': [ticketId: string]
  'quick-assign': [ticketId: string]
}>()

const searchQuery = ref('')
const internalCollapsed = ref(false)

const isCollapsed = computed(() => props.collapsed ?? internalCollapsed.value)

const filteredTickets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return props.tickets
  }

  return props.tickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(query)
  )
})

const toggleCollapsed = () => {
  const next = !isCollapsed.value

  if (props.collapsed === undefined) {
    internalCollapsed.value = next
  }

  emit('update:collapsed', next)
}
</script>
