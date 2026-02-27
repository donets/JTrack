<template>
  <ul class="space-y-4">
    <li
      v-for="item in items"
      :key="item.id"
      class="relative border-l border-slate-200 pl-5"
    >
      <span
        :class="dotClasses(item.type)"
        class="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full"
      />

      <div class="rounded-md border border-slate-200 bg-white p-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <JAvatar
              :name="item.actor.name"
              :src="item.actor.avatarUrl"
              size="sm"
            />
            <div class="text-sm">
              <p class="font-semibold text-ink">{{ item.actor.name }}</p>
              <p class="text-xs text-slate-500">{{ typeLabel(item.type) }}</p>
            </div>
          </div>

          <p class="shrink-0 text-xs text-slate-500">{{ formatTimestamp(item.timestamp) }}</p>
        </div>

        <p class="mt-2 text-sm text-slate-700">{{ item.content }}</p>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
type TimelineEventType = 'comment' | 'status_change' | 'payment' | 'attachment'

export type TimelineItem = {
  id: string
  type: TimelineEventType
  actor: {
    name: string
    avatarUrl?: string
  }
  content: string
  timestamp: string
}

defineProps<{
  items: TimelineItem[]
}>()

const dotClasses = (type: TimelineEventType) => {
  if (type === 'comment') {
    return 'bg-sky'
  }

  if (type === 'status_change') {
    return 'bg-violet'
  }

  if (type === 'payment') {
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
