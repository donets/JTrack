<template>
  <ul>
    <li
      v-for="item in items"
      :key="item.id"
      class="relative border-l border-mist-dark pb-4 pl-5 last:pb-0"
    >
      <span :class="dotClasses(item)" class="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full" />

      <div class="flex gap-3">
        <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist-dark text-[11px] font-semibold text-ink">
          <img
            v-if="item.actor.avatarUrl"
            :src="item.actor.avatarUrl"
            :alt="item.actor.name"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ initials(item.actor.name) }}</span>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <p class="font-semibold text-ink">{{ item.actor.name }}</p>
            <p class="text-ink-light">{{ typeLabel(item.type) }}</p>
            <span class="text-slate-400">•</span>
            <p class="text-slate-500" :title="formatAbsolute(item.timestamp)">{{ formatRelative(item.timestamp) }}</p>
            <button
              v-if="canDeleteComment(item)"
              type="button"
              class="ml-auto text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="deletingCommentId === item.commentId"
              @click="item.commentId && emit('delete-comment', item.commentId)"
            >
              Delete
            </button>
          </div>

          <p class="mt-1 whitespace-pre-wrap text-sm text-ink-light">{{ item.content }}</p>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { TimelineEventType, TimelineItem } from '~/types/ui'

const props = withDefaults(
  defineProps<{
    items: TimelineItem[]
    deletableCommentIds?: string[]
    deletingCommentId?: string | null
  }>(),
  {
    deletableCommentIds: () => [],
    deletingCommentId: null
  }
)

const emit = defineEmits<{
  'delete-comment': [commentId: string]
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

const formatAbsolute = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

const formatRelative = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const diffMs = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) {
    return 'just now'
  }

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  if (diffMs < 2 * day) {
    return 'yesterday'
  }

  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString()
}

const initials = (name: string) => {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) {
    return '?'
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

const canDeleteComment = (item: TimelineItem) =>
  item.type === 'comment' && Boolean(item.commentId) && props.deletableCommentIds.includes(item.commentId as string)
</script>
