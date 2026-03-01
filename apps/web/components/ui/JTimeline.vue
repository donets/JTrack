<template>
  <ul>
    <li
      v-for="item in items"
      :key="item.id"
      class="relative border-l border-mist-dark pb-4 pl-5 last:pb-0"
    >
      <span :class="dotClasses(item)" class="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full" />

      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <p class="font-semibold text-ink">{{ item.actor.name }}</p>
        <p class="text-ink-light">{{ typeLabel(item.type) }}</p>
        <span class="text-slate-400">•</span>
        <p class="text-slate-500">{{ formatTimestamp(item.timestamp) }}</p>
      </div>

      <p class="mt-1 text-sm text-ink-light">{{ item.content }}</p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { TimelineEventType, TimelineItem } from '~/types/ui'

defineProps<{
  items: TimelineItem[]
}>()

const dotClasses = (item: TimelineItem) => {
  if (item.color) {
    const explicitColorClasses: Record<NonNullable<TimelineItem['color']>, string> = {
      mist: 'bg-slate-400',
      sky: 'bg-sky',
      mint: 'bg-mint',
      violet: 'bg-violet',
      flame: 'bg-flame',
      rose: 'bg-rose'
    }
    return explicitColorClasses[item.color]
  }

  if (item.type === 'comment') {
    return 'bg-sky'
  }

  if (item.type === 'status_change') {
    return 'bg-violet'
  }

  if (item.type === 'payment') {
    return 'bg-mint'
  }

  return 'bg-flame'
}

const typeLabel = (type: TimelineEventType) => {
  if (type === 'status_change') {
    return 'Status change'
  }

  if (type === 'payment') {
    return 'Payment'
  }

  if (type === 'attachment') {
    return 'Attachment'
  }

  if (type === 'assignment') {
    return 'Assignment'
  }

  if (type === 'created') {
    return 'Created'
  }

  return 'Comment'
}

const formatTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}
</script>
