<template>
  <article
    class="group cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    draggable="true"
    @dragstart="onDragStart"
  >
    <div class="mb-2 flex items-start justify-between gap-2">
      <div class="min-w-0 space-y-1">
        <p
          v-if="showCode"
          class="text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500"
        >
          {{ ticketCode }}
        </p>
        <button
          type="button"
          class="line-clamp-2 text-left text-sm font-semibold text-ink transition-colors group-hover:text-mint"
          @click="emit('open-ticket', ticket.id)"
        >
          {{ ticket.title }}
        </button>
      </div>

      <JBadge :variant="priorityToBadgeVariant(ticket.priority)" size="sm">
        {{ priorityLabel }}
      </JBadge>
    </div>

    <p v-if="dueLabel" class="mb-2 text-[11px] font-medium text-flame">
      {{ dueLabel }}
    </p>

    <div class="flex items-center justify-between gap-2">
      <div class="inline-flex min-w-0 items-center gap-2">
        <JAvatar :name="assigneeLabel" size="sm" />
        <span class="truncate text-xs text-slate-600">{{ assigneeLabel }}</span>
      </div>

      <button
        type="button"
        class="rounded px-2 py-1 text-[11px] font-semibold text-sky transition-colors hover:bg-sky-light hover:text-sky"
        @click="emit('quick-assign', ticket.id)"
      >
        Assign
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KanbanTicketCardItem } from '~/types/ui'
import {
  formatTicketCode,
  priorityToBadgeVariant,
  shouldShowTicketCode
} from '~/utils/ticketVisuals'

const props = withDefaults(
  defineProps<{
    ticket: KanbanTicketCardItem
    showTicketCode?: boolean
  }>(),
  {
    showTicketCode: false
  }
)

const emit = defineEmits<{
  'drag-start': [payload: { ticketId: string }]
  'open-ticket': [ticketId: string]
  'quick-assign': [ticketId: string]
}>()

const showCode = computed(() => shouldShowTicketCode(props.showTicketCode))
const ticketCode = computed(() => formatTicketCode(props.ticket.id, props.ticket.ticketNumber))

const assigneeLabel = computed(() => props.ticket.assigneeName || 'Unassigned')
const dueLabel = computed(() => formatDue(props.ticket.dueAt ?? props.ticket.scheduledStartAt ?? null))

const priorityLabel = computed(() => {
  const raw = props.ticket.priority
  if (!raw) {
    return 'None'
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
})

const onDragStart = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.ticket.id)
    event.dataTransfer.setData('application/x-jtrack-ticket-id', props.ticket.id)
  }

  emit('drag-start', { ticketId: props.ticket.id })
}

function formatDue(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return `Due ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })}`
}
</script>
