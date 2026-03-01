<template>
  <section class="space-y-3">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-sm font-semibold text-ink">
        {{ headerLabel }}
      </h2>
      <div class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
        <JButton variant="ghost" size="sm" @click="moveDate(-1)">Prev</JButton>
        <JButton variant="ghost" size="sm" @click="jumpToToday">Today</JButton>
        <JButton variant="ghost" size="sm" @click="moveDate(1)">Next</JButton>
      </div>
    </header>

    <div class="overflow-x-auto">
      <div class="min-w-max rounded-xl border border-slate-200 bg-white">
        <div class="grid border-b border-slate-200" :style="gridStyle">
          <div class="border-r border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Technician
          </div>
          <div
            v-for="hour in hourSlots"
            :key="hour"
            class="border-r border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500 last:border-r-0"
          >
            {{ formatHourLabel(hour) }}
          </div>
        </div>

        <div class="relative min-h-[120px]">
          <div class="pointer-events-none absolute inset-0 grid" :style="gridStyle">
            <div class="border-r border-slate-200" />
            <div
              v-for="hour in hourSlots"
              :key="`grid-${hour}`"
              class="border-r border-slate-100 last:border-r-0"
            />
          </div>

          <div
            v-if="showCurrentTimeIndicator"
            class="pointer-events-none absolute bottom-0 top-0 z-10 w-[2px] bg-rose"
            :style="{ left: `${currentTimeOffsetPx}px` }"
            aria-hidden="true"
          />

          <div class="relative">
            <slot
              :date="normalizedDate"
              :start-hour="startHour"
              :end-hour="endHour"
              :hour-slots="hourSlots"
              :label-width="labelWidthPx"
              :hour-width="hourWidthPx"
              :grid-style="gridStyle"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { DispatchTimeGridNavEvent } from '~/types/ui'

const props = withDefaults(
  defineProps<{
    date: string
    startHour?: number
    endHour?: number
    labelWidthPx?: number
    hourWidthPx?: number
  }>(),
  {
    startHour: 7,
    endHour: 19,
    labelWidthPx: 220,
    hourWidthPx: 84
  }
)

const emit = defineEmits<{
  navigate: [payload: DispatchTimeGridNavEvent]
  'update:date': [value: string]
}>()

const now = ref(new Date())
let nowTimer: ReturnType<typeof setInterval> | null = null

const normalizedDate = computed(() => normalizeDate(props.date))
const dayStart = computed(() => parseDate(normalizedDate.value))
const dayEnd = computed(() => addDays(dayStart.value, 1))

const hourSlots = computed(() => {
  const slots: number[] = []
  for (let hour = props.startHour; hour < props.endHour; hour += 1) {
    slots.push(hour)
  }
  return slots
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `${props.labelWidthPx}px repeat(${hourSlots.value.length}, ${props.hourWidthPx}px)`
}))

const headerLabel = computed(() =>
  dayStart.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
)

const showCurrentTimeIndicator = computed(() =>
  isSameDate(dayStart.value, now.value)
  && now.value >= dayStart.value
  && now.value <= dayEnd.value
)

const currentTimeOffsetPx = computed(() => {
  const minutesFromStart = now.value.getHours() * 60 + now.value.getMinutes() - props.startHour * 60
  const totalMinutes = (props.endHour - props.startHour) * 60
  const clamped = Math.max(0, Math.min(totalMinutes, minutesFromStart))
  return props.labelWidthPx + (clamped / 60) * props.hourWidthPx
})

const moveDate = (days: number) => {
  const next = addDays(dayStart.value, days)
  const date = normalizeDate(formatDate(next))
  emit('update:date', date)
  emit('navigate', { date })
}

const jumpToToday = () => {
  const date = normalizeDate(formatDate(new Date()))
  emit('update:date', date)
  emit('navigate', { date })
}

const formatHourLabel = (hour: number) => {
  const local = new Date(dayStart.value)
  local.setHours(hour, 0, 0, 0)

  return local.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

onMounted(() => {
  nowTimer = setInterval(() => {
    now.value = new Date()
  }, 60 * 1000)
})

onUnmounted(() => {
  if (nowTimer) {
    clearInterval(nowTimer)
  }
})

function normalizeDate(value: string) {
  if (!value || Number.isNaN(parseDate(value).getTime())) {
    return formatDate(new Date())
  }
  return formatDate(parseDate(value))
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  )
}
</script>
