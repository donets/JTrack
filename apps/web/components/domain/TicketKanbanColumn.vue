<template>
  <section
    class="flex h-full min-h-[320px] w-[280px] shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50/60"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <header class="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
      <div class="inline-flex items-center gap-2">
        <span class="text-sm" :class="dotClass" aria-hidden="true">●</span>
        <h3 class="text-sm font-semibold text-ink">{{ title }}</h3>
      </div>
      <span class="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">{{ count }}</span>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <div
        v-if="tickets.length === 0"
        class="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 px-4 text-center text-xs text-slate-500 transition-colors"
        :class="isDropActive ? 'border-sky bg-sky-light/25 text-sky ring-2 ring-inset ring-sky/40' : ''"
      >
        Drop ticket here
      </div>

      <div v-else class="space-y-2.5">
        <TicketKanbanCard
          v-for="ticket in tickets"
          :key="ticket.id"
          :ticket="ticket"
          :show-ticket-code="showTicketCode"
          @drag-start="emit('drag-start', $event)"
          @open-ticket="emit('open-ticket', $event)"
          @quick-assign="emit('quick-assign', $event)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TicketStatus } from '@jtrack/shared'
import type { KanbanColumnDropPayload, KanbanTicketCardItem } from '~/types/ui'

const props = withDefaults(
  defineProps<{
    status: TicketStatus
    title?: string
    color?: string
    tickets: KanbanTicketCardItem[]
    showTicketCode?: boolean
  }>(),
  {
    title: undefined,
    color: undefined,
    showTicketCode: false
  }
)

const emit = defineEmits<{
  'ticket-drop': [payload: KanbanColumnDropPayload]
  'drag-start': [payload: { ticketId: string }]
  'open-ticket': [ticketId: string]
  'quick-assign': [ticketId: string]
}>()

const isDropActive = ref(false)
const dragDepth = ref(0)

const count = computed(() => props.tickets.length)
const title = computed(() => props.title ?? props.status)

const dotClass = computed(() => {
  if (props.color) {
    return props.color
  }

  const map: Record<string, string> = {
    New: 'text-sky',
    Scheduled: 'text-violet',
    InProgress: 'text-flame',
    Done: 'text-mint',
    Invoiced: 'text-sky',
    Paid: 'text-mint',
    Canceled: 'text-slate-400'
  }

  return map[props.status] ?? 'text-slate-400'
})

const extractTicketId = (event: DragEvent) =>
  event.dataTransfer?.getData('application/x-jtrack-ticket-id')
  || event.dataTransfer?.getData('text/plain')
  || ''

const onDragEnter = (event: DragEvent) => {
  event.preventDefault()
  dragDepth.value += 1
  isDropActive.value = true

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDropActive.value = true

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDragLeave = () => {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
  if (dragDepth.value === 0) {
    isDropActive.value = false
  }
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  dragDepth.value = 0
  isDropActive.value = false

  const ticketId = extractTicketId(event)
  if (!ticketId) {
    return
  }

  emit('ticket-drop', { ticketId, toStatus: props.status })
}
</script>
