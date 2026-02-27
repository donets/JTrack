<template>
  <section v-if="ticket" class="space-y-4">
    <JPageHeader
      :title="`${ticketCode} ${ticket.title}`"
      :breadcrumbs="breadcrumbs"
    >
      <template #status>
        <JBadge :variant="statusToBadgeVariant(ticket.status)">{{ statusToLabel(ticket.status) }}</JBadge>
      </template>

      <template #actions>
        <JButton size="sm" variant="secondary" disabled>Edit</JButton>
        <JButton size="sm" variant="danger" :disabled="ticket.status === 'Canceled'" @click="cancelTicket">
          Cancel
        </JButton>
      </template>
    </JPageHeader>

    <div class="grid grid-cols-3 gap-2 md:hidden">
      <JButton size="sm" :disabled="ticket.status === 'InProgress'" @click="updateTicketStatus('InProgress')">
        Start Job
      </JButton>
      <JButton size="sm" variant="secondary">Navigate</JButton>
      <JButton size="sm" variant="secondary">Call</JButton>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
      <div class="space-y-4">
        <JCard title="Description">
          <p class="text-sm text-ink-light">
            {{ ticket.description || 'No description provided.' }}
          </p>
        </JCard>

        <JCard title="Activity">
          <JTimeline :items="timelineItems" />
        </JCard>

        <JCard>
          <form class="space-y-3" @submit.prevent="addComment">
            <JTextarea
              v-model="commentBody"
              placeholder="Write a comment..."
              :rows="3"
            />

            <div class="flex flex-wrap items-center justify-end gap-2">
              <JButton size="sm" variant="secondary" :disabled="uploadingAttachment" @click="openFileDialog">
                Attach
              </JButton>
              <JButton size="sm" variant="secondary" :disabled="uploadingAttachment" @click="capturePhoto">
                Photo
              </JButton>
              <JButton size="sm" type="submit" :disabled="!commentBody.trim()" :loading="submittingComment">
                Send
              </JButton>
            </div>
          </form>
        </JCard>

        <JCard :title="`Attachments (${attachments.length})`" :padding="false">
          <div class="space-y-3 p-4">
            <button
              type="button"
              class="w-full rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 hover:border-mint hover:text-ink"
              :disabled="uploadingAttachment"
              @click="openFileDialog"
              @drop.prevent="onDropFiles"
              @dragover.prevent
            >
              Drag & drop files here, or click to upload
            </button>

            <div v-if="attachments.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <article
                v-for="attachment in attachments"
                :key="attachment.id"
                class="overflow-hidden rounded-md border border-slate-200 bg-white"
              >
                <div v-if="isImageAttachment(attachment)" class="aspect-video bg-slate-100">
                  <img
                    :src="attachmentUrl(attachment.url)"
                    :alt="attachment.storageKey"
                    class="h-full w-full object-cover"
                  />
                </div>
                <div v-else class="flex aspect-video items-center justify-center bg-slate-50 text-3xl text-slate-300">
                  📎
                </div>

                <div class="space-y-1 p-3 text-xs">
                  <p class="truncate font-semibold text-ink">{{ attachment.storageKey }}</p>
                  <p class="text-slate-500">{{ attachment.mimeType }} · {{ formatBytes(attachment.size) }}</p>
                  <p v-if="attachment.storageKey.startsWith('pending/')" class="text-amber-700">Pending upload</p>
                </div>
              </article>
            </div>

            <p v-else class="text-sm text-slate-500">No attachments yet.</p>
          </div>
        </JCard>
      </div>

      <div class="space-y-4">
        <JCard title="Details">
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">Status</dt>
              <dd>
                <div class="flex items-center gap-2">
                  <JBadge :variant="statusToBadgeVariant(ticket.status)">{{ statusToLabel(ticket.status) }}</JBadge>
                  <JDropdown :items="statusDropdownItems" align="right">
                    <template #trigger>
                      <JButton size="sm" variant="ghost">Change</JButton>
                    </template>
                  </JDropdown>
                </div>
              </dd>
            </div>

            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">Priority</dt>
              <dd>
                <JBadge :variant="priorityToBadgeVariant(ticket.priority)">{{ formatPriorityLabel(ticket.priority) }}</JBadge>
              </dd>
            </div>

            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">Assigned</dt>
              <dd class="text-right text-ink">{{ assignedLabel }}</dd>
            </div>

            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">Created by</dt>
              <dd class="text-right text-ink">{{ createdByLabel }}</dd>
            </div>

            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">Created</dt>
              <dd class="text-right text-ink">{{ formatDateTime(ticket.createdAt) }}</dd>
            </div>

            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">Scheduled</dt>
              <dd class="text-right text-ink">{{ scheduledRangeLabel }}</dd>
            </div>
          </dl>
        </JCard>

        <JCard title="Financial">
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">Total amount</dt>
              <dd class="font-semibold text-ink">{{ totalAmountLabel }}</dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">Paid</dt>
              <dd class="font-semibold text-ink">{{ paidAmountLabel }}</dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">Balance</dt>
              <dd class="font-semibold text-ink">{{ balanceAmountLabel }}</dd>
            </div>
          </dl>

          <JButton class="mt-4 w-full" size="sm" variant="secondary" disabled>
            + Record Payment
          </JButton>
        </JCard>

        <JCard :title="`Checklist ${completedChecklistCount}/${checklistItems.length}`">
          <JProgress :value="completedChecklistCount" :max="checklistItems.length" variant="mint" />

          <div class="mt-3 space-y-2">
            <JCheckbox
              v-for="item in checklistItems"
              :key="item.id"
              v-model="item.done"
              :label="item.label"
            />
          </div>
        </JCard>
      </div>
    </div>

    <input ref="fileInput" class="hidden" type="file" @change="onWebFileSelected" />
  </section>

  <section v-else class="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
    Ticket not found in local database
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem, DropdownItem, TimelineItem } from '~/types/ui'
import type { PaymentRecord, Ticket, TicketAttachment, TicketComment, TicketStatus } from '@jtrack/shared'
import {
  priorityToBadgeVariant,
  statusToBadgeVariant,
  statusToLabel
} from '~/utils/ticket-status'

interface LocationUser {
  id: string
  name: string
}

const ALL_STATUSES: TicketStatus[] = ['New', 'Scheduled', 'InProgress', 'Done', 'Invoiced', 'Paid', 'Canceled']

const route = useRoute()
const config = useRuntimeConfig()
const db = useRxdb()
const locationStore = useLocationStore()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const adapter = useAttachmentAdapter()
const api = useApiClient()
const { setBreadcrumbs } = useBreadcrumbs()
const { hasPrivilege } = useRbacGuard()

const ticketId = route.params.id as string

const ticket = ref<Ticket | null>(null)
const comments = ref<TicketComment[]>([])
const attachments = ref<TicketAttachment[]>([])
const payments = ref<PaymentRecord[]>([])
const users = ref<LocationUser[]>([])
const commentBody = ref('')
const submittingComment = ref(false)
const uploadingAttachment = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const checklistItems = reactive([
  { id: 'inspect', label: 'Inspect unit', done: false },
  { id: 'refrigerant', label: 'Check refrigerant levels', done: false },
  { id: 'thermostat', label: 'Test thermostat', done: false },
  { id: 'signoff', label: 'Customer sign-off', done: false }
])

let ticketSub: { unsubscribe: () => void } | null = null
let commentsSub: { unsubscribe: () => void } | null = null
let attachmentsSub: { unsubscribe: () => void } | null = null
let paymentsSub: { unsubscribe: () => void } | null = null

const ticketCode = computed(() => `#${ticketId.slice(0, 8).toUpperCase()}`)

const breadcrumbs = ref<BreadcrumbItem[]>([
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Tickets', to: '/tickets' },
  { label: ticketCode.value }
])

watch(
  () => ticket.value?.title,
  (title) => {
    breadcrumbs.value = [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Tickets', to: '/tickets' },
      { label: title ? `${ticketCode.value} ${title}` : ticketCode.value }
    ]

    setBreadcrumbs(breadcrumbs.value)
  },
  { immediate: true }
)

const userNameById = computed(() => {
  const map = new Map<string, string>()

  for (const user of users.value) {
    map.set(user.id, user.name)
  }

  return map
})

const assignedLabel = computed(() => {
  if (!ticket.value?.assignedToUserId) {
    return '— Unassigned —'
  }

  return userNameById.value.get(ticket.value.assignedToUserId) ?? `User ${ticket.value.assignedToUserId.slice(0, 8)}`
})

const createdByLabel = computed(() => {
  if (!ticket.value) {
    return '—'
  }

  return userNameById.value.get(ticket.value.createdByUserId) ?? `User ${ticket.value.createdByUserId.slice(0, 8)}`
})

const scheduledRangeLabel = computed(() => {
  if (!ticket.value?.scheduledStartAt) {
    return 'Not set'
  }

  if (!ticket.value.scheduledEndAt) {
    return formatDateTime(ticket.value.scheduledStartAt)
  }

  return `${formatDateTime(ticket.value.scheduledStartAt)} - ${formatDateTime(ticket.value.scheduledEndAt)}`
})

const paidAmountCents = computed(() => payments.value.reduce((sum, payment) => sum + payment.amountCents, 0))

const balanceAmountCents = computed(() => {
  const total = ticket.value?.totalAmountCents
  if (total === null || total === undefined) {
    return null
  }

  return Math.max(total - paidAmountCents.value, 0)
})

const totalAmountLabel = computed(() => formatMoney(ticket.value?.totalAmountCents ?? null, ticket.value?.currency ?? 'EUR'))
const paidAmountLabel = computed(() => formatMoney(paidAmountCents.value, ticket.value?.currency ?? 'EUR'))
const balanceAmountLabel = computed(() => formatMoney(balanceAmountCents.value, ticket.value?.currency ?? 'EUR'))

const completedChecklistCount = computed(() => checklistItems.filter((item) => item.done).length)

const statusDropdownItems = computed<DropdownItem[]>(() => {
  if (!ticket.value) {
    return []
  }

  return ALL_STATUSES.filter((status) => status !== ticket.value?.status).map((status) => ({
    label: statusToLabel(status),
    action: () => updateTicketStatus(status)
  }))
})

const timelineItems = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = []

  if (ticket.value) {
    items.push({
      id: `${ticket.value.id}-created`,
      type: 'status_change',
      actor: {
        name: createdByLabel.value
      },
      content: `${ticketCode.value} created`,
      timestamp: ticket.value.createdAt
    })

    if (ticket.value.updatedAt !== ticket.value.createdAt) {
      items.push({
        id: `${ticket.value.id}-status-${ticket.value.updatedAt}`,
        type: 'status_change',
        actor: {
          name: 'System'
        },
        content: `${ticketCode.value} set to ${statusToLabel(ticket.value.status)}`,
        timestamp: ticket.value.updatedAt
      })
    }
  }

  for (const comment of comments.value) {
    items.push({
      id: comment.id,
      type: 'comment',
      actor: {
        name: userNameById.value.get(comment.authorUserId) ?? `User ${comment.authorUserId.slice(0, 8)}`
      },
      content: comment.body,
      timestamp: comment.createdAt
    })
  }

  for (const payment of payments.value) {
    items.push({
      id: payment.id,
      type: 'payment',
      actor: {
        name: 'System'
      },
      content: `${providerLabel(payment.provider)} payment ${formatMoney(payment.amountCents, payment.currency)} (${payment.status})`,
      timestamp: payment.createdAt
    })
  }

  return items.sort((left, right) => {
    const leftTs = new Date(left.timestamp).getTime()
    const rightTs = new Date(right.timestamp).getTime()

    if (Number.isNaN(leftTs) && Number.isNaN(rightTs)) {
      return 0
    }

    if (Number.isNaN(leftTs)) {
      return 1
    }

    if (Number.isNaN(rightTs)) {
      return -1
    }

    return rightTs - leftTs
  })
})

const bindStreams = () => {
  ticketSub?.unsubscribe()
  commentsSub?.unsubscribe()
  attachmentsSub?.unsubscribe()
  paymentsSub?.unsubscribe()

  if (!locationStore.activeLocationId) {
    ticket.value = null
    comments.value = []
    attachments.value = []
    payments.value = []
    return
  }

  ticketSub = db.collections.tickets
    .findOne({
      selector: {
        id: ticketId,
        locationId: locationStore.activeLocationId
      }
    })
    .$
    .subscribe((doc: { toJSON: () => Ticket } | null) => {
      ticket.value = doc?.toJSON() ?? null
    })

  commentsSub = db.collections.ticketComments
    .find({
      selector: {
        ticketId,
        locationId: locationStore.activeLocationId
      }
    })
    .$
    .subscribe((docs: Array<{ toJSON: () => TicketComment }>) => {
      comments.value = docs
        .map((doc) => doc.toJSON())
        .filter((comment) => !comment.deletedAt)
    })

  attachmentsSub = db.collections.ticketAttachments
    .find({
      selector: {
        ticketId,
        locationId: locationStore.activeLocationId
      }
    })
    .$
    .subscribe((docs: Array<{ toJSON: () => TicketAttachment }>) => {
      attachments.value = docs
        .map((doc) => doc.toJSON())
        .filter((attachment) => !attachment.deletedAt)
        .sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1))
    })

  paymentsSub = db.collections.paymentRecords
    .find({
      selector: {
        ticketId,
        locationId: locationStore.activeLocationId
      }
    })
    .$
    .subscribe((docs: Array<{ toJSON: () => PaymentRecord }>) => {
      payments.value = docs.map((doc) => doc.toJSON())
    })
}

const loadUsers = async () => {
  if (!locationStore.activeLocationId || !hasPrivilege('users.read')) {
    users.value = []
    return
  }

  try {
    const payload = await api.get<Array<{ id: string; name: string }>>('/users')
    users.value = payload
  } catch {
    users.value = []
  }
}

watch(() => locationStore.activeLocationId, bindStreams, { immediate: true })
watch(() => locationStore.activeLocationId, loadUsers, { immediate: true })

onUnmounted(() => {
  ticketSub?.unsubscribe()
  commentsSub?.unsubscribe()
  attachmentsSub?.unsubscribe()
  paymentsSub?.unsubscribe()
})

const updateTicketStatus = async (status: TicketStatus) => {
  if (!ticket.value || ticket.value.status === status) {
    return
  }

  await repository.saveTicket({
    id: ticket.value.id,
    status
  })

  await syncStore.syncNow()
}

const cancelTicket = async () => {
  await updateTicketStatus('Canceled')
}

const addComment = async () => {
  if (!commentBody.value.trim() || submittingComment.value) {
    return
  }

  submittingComment.value = true

  try {
    await repository.addComment({
      ticketId,
      body: commentBody.value.trim()
    })

    commentBody.value = ''
    await syncStore.syncNow()
  } finally {
    submittingComment.value = false
  }
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const uploadFile = async (file: File) => {
  uploadingAttachment.value = true

  try {
    const payload = await adapter.fromFile(file)
    await adapter.uploadAttachment(ticketId, payload)
    await syncStore.syncNow()
  } finally {
    uploadingAttachment.value = false
  }
}

const onWebFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (!file) {
    return
  }

  await uploadFile(file)

  if (input) {
    input.value = ''
  }
}

const onDropFiles = async (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0]

  if (!file) {
    return
  }

  await uploadFile(file)
}

const capturePhoto = async () => {
  if (uploadingAttachment.value) {
    return
  }

  uploadingAttachment.value = true

  try {
    const payload = await adapter.captureFromDevice()
    await adapter.uploadAttachment(ticketId, payload)
    await syncStore.syncNow()
  } catch {
    // Ignore when camera is unavailable outside mobile shell
  } finally {
    uploadingAttachment.value = false
  }
}

const attachmentUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return `${config.public.apiBase}${url}`
}

const isImageAttachment = (attachment: TicketAttachment) =>
  attachment.mimeType.startsWith('image/') &&
  Boolean(attachment.url) &&
  !attachment.storageKey.startsWith('pending/')

const formatDateTime = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatBytes = (size: number) => {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const formatMoney = (amountCents: number | null, currency: string) => {
  if (amountCents === null) {
    return '—'
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0
  }).format(amountCents / 100)
}

const providerLabel = (provider: string) => {
  if (provider === 'stripe') {
    return 'Stripe'
  }

  if (provider === 'manual') {
    return 'Manual'
  }

  return provider
}

const formatPriorityLabel = (priority: string | null) => {
  const normalized = priority?.trim().toLowerCase()

  if (!normalized) {
    return 'None'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}
</script>
