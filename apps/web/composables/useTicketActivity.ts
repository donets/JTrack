import type { ComputedRef, Ref } from 'vue'
import { formatMoney } from '~/utils/format'
import { statusToLabel } from '~/utils/ticket-status'
import type { TimelineEventType, TimelineItem } from '~/types/ui'
import type { TicketActivity, TicketComment, TicketStatus } from '@jtrack/shared'

type ActivityUser = {
  id: string
  name: string
  avatarUrl?: string
}

type TicketActivityFeedItem = {
  id: string
  type: TimelineEventType
  user: {
    id: string | null
    name: string
    avatarUrl?: string
  }
  message: string
  timestamp: string
  icon: string
  color: 'mist' | 'sky' | 'mint' | 'violet' | 'flame' | 'rose'
}

const TIMELINE_STYLE: Record<TimelineEventType, Pick<TicketActivityFeedItem, 'icon' | 'color'>> = {
  comment: { icon: 'chat', color: 'sky' },
  status_change: { icon: 'swap', color: 'violet' },
  assignment: { icon: 'user-plus', color: 'mint' },
  payment: { icon: 'credit-card', color: 'violet' },
  attachment: { icon: 'paperclip', color: 'flame' },
  created: { icon: 'sparkles', color: 'mist' }
}

const STATUS_VALUES = new Set(['New', 'Scheduled', 'InProgress', 'Done', 'Invoiced', 'Paid', 'Canceled'])

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value: unknown) => (typeof value === 'string' && value.length > 0 ? value : null)
const asNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

const asStatus = (value: unknown): TicketStatus | null => {
  if (typeof value !== 'string' || !STATUS_VALUES.has(value)) {
    return null
  }

  return value as TicketStatus
}

const truncateComment = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 140) {
    return normalized
  }

  return `${normalized.slice(0, 137)}...`
}

export const useTicketActivity = (options: {
  ticketId: Ref<string>
  users: Ref<ActivityUser[]> | ComputedRef<ActivityUser[]>
}) => {
  const db = useRxdb()
  const locationStore = useLocationStore()

  const activities = ref<TicketActivity[]>([])
  const comments = ref<TicketComment[]>([])

  let activitiesSub: { unsubscribe: () => void } | null = null
  let commentsSub: { unsubscribe: () => void } | null = null

  const usersById = computed(() => {
    const map = new Map<string, ActivityUser>()
    for (const user of options.users.value) {
      map.set(user.id, user)
    }
    return map
  })

  const resolveUser = (userId: string | null) => {
    if (!userId) {
      return { id: null, name: 'System' }
    }

    const user = usersById.value.get(userId)
    if (!user) {
      return {
        id: userId,
        name: `User ${userId.slice(0, 8)}`
      }
    }

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl
    }
  }

  const bindStreams = () => {
    activitiesSub?.unsubscribe()
    commentsSub?.unsubscribe()

    const locationId = locationStore.activeLocationId
    if (!locationId) {
      activities.value = []
      comments.value = []
      return
    }

    activitiesSub = db.collections.ticketActivities
      .find({
        selector: {
          ticketId: options.ticketId.value,
          locationId
        }
      })
      .$
      .subscribe((docs: Array<{ toJSON: () => TicketActivity }>) => {
        activities.value = docs.map((doc) => doc.toJSON())
      })

    commentsSub = db.collections.ticketComments
      .find({
        selector: {
          ticketId: options.ticketId.value,
          locationId
        }
      })
      .$
      .subscribe((docs: Array<{ toJSON: () => TicketComment }>) => {
        comments.value = docs.map((doc) => doc.toJSON()).filter((comment) => !comment.deletedAt)
      })
  }

  watch([() => locationStore.activeLocationId, () => options.ticketId.value], bindStreams, { immediate: true })

  onUnmounted(() => {
    activitiesSub?.unsubscribe()
    commentsSub?.unsubscribe()
  })

  const items = computed<TicketActivityFeedItem[]>(() => {
    const merged: TicketActivityFeedItem[] = []
    const commentIds = new Set(comments.value.map((comment) => comment.id))

    for (const activity of activities.value) {
      const metadata = isObjectRecord(activity.metadata) ? activity.metadata : {}

      if (activity.type === 'comment') {
        const commentId = asString(metadata.commentId)
        if (commentId && commentIds.has(commentId)) {
          continue
        }
      }

      if (activity.type === 'status_change') {
        const from = asStatus(metadata.from)
        const to = asStatus(metadata.to)
        merged.push({
          id: activity.id,
          type: 'status_change',
          user: resolveUser(activity.userId),
          message:
            from && to
              ? `${resolveUser(activity.userId).name} changed status from ${statusToLabel(from)} to ${statusToLabel(to)}`
              : `${resolveUser(activity.userId).name} changed ticket status`,
          timestamp: activity.createdAt,
          ...TIMELINE_STYLE.status_change
        })
        continue
      }

      if (activity.type === 'assignment') {
        const fromAssignee = asString(metadata.fromAssignedToUserId)
        const toAssignee = asString(metadata.toAssignedToUserId)
        const actorName = resolveUser(activity.userId).name
        const toName = toAssignee ? resolveUser(toAssignee).name : 'Unassigned'
        const fromName = fromAssignee ? resolveUser(fromAssignee).name : 'Unassigned'

        merged.push({
          id: activity.id,
          type: 'assignment',
          user: resolveUser(activity.userId),
          message: `${actorName} reassigned ticket from ${fromName} to ${toName}`,
          timestamp: activity.createdAt,
          ...TIMELINE_STYLE.assignment
        })
        continue
      }

      if (activity.type === 'payment') {
        const amountCents = asNumber(metadata.amountCents)
        const currency = asString(metadata.currency) ?? 'EUR'
        const amountLabel =
          amountCents === null ? 'a payment' : `payment ${formatMoney(amountCents, currency)}`

        merged.push({
          id: activity.id,
          type: 'payment',
          user: resolveUser(activity.userId),
          message: `${resolveUser(activity.userId).name} recorded ${amountLabel}`,
          timestamp: activity.createdAt,
          ...TIMELINE_STYLE.payment
        })
        continue
      }

      if (activity.type === 'attachment') {
        const fileName = asString(metadata.storageKey) ?? 'attachment'
        merged.push({
          id: activity.id,
          type: 'attachment',
          user: resolveUser(activity.userId),
          message: `${resolveUser(activity.userId).name} attached ${fileName}`,
          timestamp: activity.createdAt,
          ...TIMELINE_STYLE.attachment
        })
        continue
      }

      if (activity.type === 'created') {
        merged.push({
          id: activity.id,
          type: 'created',
          user: resolveUser(activity.userId),
          message: 'Ticket created',
          timestamp: activity.createdAt,
          ...TIMELINE_STYLE.created
        })
        continue
      }

      const commentBody = asString(metadata.body) ?? asString(metadata.commentBody) ?? ''
      merged.push({
        id: activity.id,
        type: 'comment',
        user: resolveUser(activity.userId),
        message: `${resolveUser(activity.userId).name} commented: "${truncateComment(commentBody)}"`,
        timestamp: activity.createdAt,
        ...TIMELINE_STYLE.comment
      })
    }

    for (const comment of comments.value) {
      merged.push({
        id: comment.id,
        type: 'comment',
        user: resolveUser(comment.authorUserId),
        message: `${resolveUser(comment.authorUserId).name} commented: "${truncateComment(comment.body)}"`,
        timestamp: comment.createdAt,
        ...TIMELINE_STYLE.comment
      })
    }

    return merged.sort((left, right) => {
      const leftTs = new Date(left.timestamp).getTime()
      const rightTs = new Date(right.timestamp).getTime()

      if (Number.isNaN(leftTs) && Number.isNaN(rightTs)) {
        return left.id.localeCompare(right.id)
      }

      if (Number.isNaN(leftTs)) {
        return 1
      }

      if (Number.isNaN(rightTs)) {
        return -1
      }

      if (leftTs === rightTs) {
        return left.id.localeCompare(right.id)
      }

      return rightTs - leftTs
    })
  })

  const timelineItems = computed<TimelineItem[]>(() =>
    items.value.map((item) => ({
      id: item.id,
      type: item.type,
      actor: {
        name: item.user.name,
        avatarUrl: item.user.avatarUrl
      },
      content: item.message,
      timestamp: item.timestamp,
      icon: item.icon,
      color: item.color
    }))
  )

  return {
    items,
    timelineItems
  }
}
