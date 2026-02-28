<template>
  <div class="grid min-h-[84px] border-b border-slate-100" :style="gridStyle">
    <div class="border-r border-slate-200 px-3 py-3">
      <div class="inline-flex items-center gap-2">
        <JAvatar :name="technician.avatarName || technician.name" size="sm" />
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-ink">{{ technician.name }}</p>
          <p class="text-xs text-slate-500">{{ technician.jobs.length }} jobs</p>
        </div>
      </div>
    </div>

    <div
      ref="timelineRef"
      class="relative"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div
        v-if="isDropActive"
        class="pointer-events-none absolute inset-0 z-10 border-2 border-dashed border-sky bg-sky-light/20"
      />

      <button
        v-for="job in jobs"
        :key="job.id"
        type="button"
        :class="['absolute top-2 h-8 rounded-md px-2 text-left text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90', statusClass(job.status)]"
        :style="jobStyle(job)"
        @click="emit('open-ticket', { ticketId: job.id })"
      >
        <span class="block truncate">{{ job.title }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  DispatchGanttRowDropPayload,
  DispatchGanttRowOpenPayload,
  DispatchScheduledJob,
  DispatchTechnician
} from '~/types/ui'
import { positionPxToRoundedIso, timeRangeToRectPx } from '~/utils/scheduling'

const props = withDefaults(
  defineProps<{
    technician: DispatchTechnician
    jobs: DispatchScheduledJob[]
    date: string
    startHour?: number
    endHour?: number
    labelWidthPx?: number
    hourWidthPx?: number
    defaultDurationMinutes?: number
  }>(),
  {
    startHour: 7,
    endHour: 19,
    labelWidthPx: 220,
    hourWidthPx: 84,
    defaultDurationMinutes: 60
  }
)

const emit = defineEmits<{
  'ticket-drop': [payload: DispatchGanttRowDropPayload]
  'open-ticket': [payload: DispatchGanttRowOpenPayload]
}>()

const timelineRef = ref<HTMLElement | null>(null)
const isDropActive = ref(false)

const gridStyle = computed(() => ({
  gridTemplateColumns: `${props.labelWidthPx}px ${Math.max(0, props.endHour - props.startHour) * props.hourWidthPx}px`
}))

const layout = computed(() => ({
  date: props.date,
  startHour: props.startHour,
  endHour: props.endHour,
  hourWidthPx: props.hourWidthPx
}))

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    New: 'bg-sky',
    Scheduled: 'bg-violet',
    InProgress: 'bg-flame',
    Done: 'bg-mint',
    Invoiced: 'bg-sky',
    Paid: 'bg-mint',
    Canceled: 'bg-slate-400'
  }

  return map[status] ?? 'bg-slate-500'
}

const jobStyle = (job: DispatchScheduledJob) => {
  const { left, width } = timeRangeToRectPx(job.scheduledStartAt, job.scheduledEndAt, layout.value)

  return {
    left: `${left}px`,
    width: `${width}px`
  }
}

const extractTicketId = (event: DragEvent) =>
  event.dataTransfer?.getData('application/x-jtrack-ticket-id')
  || event.dataTransfer?.getData('text/plain')
  || ''

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDropActive.value = true

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDragLeave = () => {
  isDropActive.value = false
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  isDropActive.value = false

  const ticketId = extractTicketId(event)
  if (!ticketId || !timelineRef.value) {
    return
  }

  const rect = timelineRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const scheduledStartAt = positionPxToRoundedIso(x, layout.value, 30)
  const start = new Date(scheduledStartAt)
  const scheduledEndAt = new Date(
    start.getTime() + props.defaultDurationMinutes * 60 * 1000
  ).toISOString()

  emit('ticket-drop', {
    ticketId,
    technicianId: props.technician.id,
    scheduledStartAt,
    scheduledEndAt
  })
}
</script>
