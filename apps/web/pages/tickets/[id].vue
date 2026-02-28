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
        <JButton size="sm" variant="secondary" @click="openEditModal">Edit</JButton>
        <JButton size="sm" variant="danger" :disabled="!canCancel || updatingStatus" @click="cancelTicket">
          Cancel
        </JButton>
      </template>
    </JPageHeader>

    <div class="grid grid-cols-3 gap-2 xl:hidden">
      <JButton size="sm" :disabled="!canStartJob || updatingStatus" @click="updateTicketStatus('InProgress')">
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
              class="w-full rounded-md border border-dashed px-4 py-6 text-center text-sm hover:border-mint hover:text-ink"
              :class="isDragOver ? 'border-mint bg-mint-light text-ink' : 'border-slate-300 text-slate-500'"
              aria-dropeffect="copy"
              :disabled="uploadingAttachment"
              @click="openFileDialog"
              @dragenter.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
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
                  <JDropdown v-if="statusDropdownItems.length > 0" :items="statusDropdownItems" align="right">
                    <template #trigger>
                      <JButton size="sm" variant="ghost" :disabled="updatingStatus">Change</JButton>
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

          <JButton class="mt-4 w-full" size="sm" variant="secondary" @click="openPaymentModal">
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

    <JModal v-model="editModalOpen" title="Edit Ticket" size="lg">
      <form id="edit-ticket-form" class="space-y-4" @submit.prevent="submitEditTicket">
        <JInput
          v-model="editForm.title"
          label="Title *"
          placeholder="Brief description of the job"
          :error="editErrors.title"
        />

        <JTextarea
          v-model="editForm.description"
          label="Description"
          placeholder="Detailed notes"
          :rows="3"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <JSelect v-model="editForm.priority" label="Priority" :options="prioritySelectOptions" />
          <JSelect v-model="editForm.assignee" label="Assign to" :options="assigneeSelectOptions" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <JDatePicker
            v-model="editForm.scheduledStartAt"
            include-time
            label="Scheduled start"
            :error="editErrors.scheduledStartAt"
          />
          <JDatePicker
            v-model="editForm.scheduledEndAt"
            include-time
            label="Scheduled end"
            :error="editErrors.scheduledEndAt"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <JInput
            v-model="editForm.amount"
            type="number"
            label="Amount"
            placeholder="0.00"
            :error="editErrors.amount"
          />
          <JSelect v-model="editForm.currency" label="Currency" :options="currencyOptions" />
        </div>
      </form>

      <template #footer>
        <JButton variant="secondary" :disabled="editSubmitting" @click="editModalOpen = false">Cancel</JButton>
        <JButton type="submit" form="edit-ticket-form" :loading="editSubmitting">Save</JButton>
      </template>
    </JModal>

    <JModal v-model="paymentModalOpen" title="Record Payment" size="md">
      <form id="record-payment-form" class="space-y-4" @submit.prevent="submitPayment">
        <div class="rounded-md bg-mist p-3 text-sm">
          <p class="text-slate-600">Amount due</p>
          <p class="mt-1 text-xl font-semibold text-ink">{{ balanceAmountLabel }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <JInput
            v-model="paymentForm.amount"
            type="number"
            label="Amount *"
            placeholder="0.00"
            :error="paymentErrors.amount"
          />
          <JSelect v-model="paymentForm.provider" label="Provider" :options="paymentProviderOptions" />
        </div>

        <JDatePicker v-model="paymentForm.date" label="Date" />
        <JTextarea v-model="paymentForm.notes" label="Notes" :rows="3" />
      </form>

      <template #footer>
        <JButton variant="secondary" :disabled="paymentSubmitting" @click="paymentModalOpen = false">Cancel</JButton>
        <JButton type="submit" form="record-payment-form" :loading="paymentSubmitting">Record Payment</JButton>
      </template>
    </JModal>
  </section>

  <section v-else class="rounded-xl border border-slate-200 bg-white p-8 text-center text-base text-slate-500">
    Ticket not found in local database.
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
import {
  formatAmountInput,
  formatDateTime,
  formatMoney,
  formatPriorityLabel,
  formatTicketCode,
  parseAmountToCents
} from '~/utils/format'

interface LocationUser {
  id: string
  name: string
}

const ALL_STATUSES: TicketStatus[] = ['New', 'Scheduled', 'InProgress', 'Done', 'Invoiced', 'Paid', 'Canceled']
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  New: ['Scheduled', 'InProgress', 'Canceled'],
  Scheduled: ['InProgress', 'Canceled'],
  InProgress: ['Done', 'Canceled'],
  Done: ['Invoiced', 'Canceled'],
  Invoiced: ['Paid', 'Canceled'],
  Paid: [],
  Canceled: []
}

const TECHNICIAN_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  New: ['InProgress'],
  Scheduled: ['InProgress'],
  InProgress: ['Done']
}

const STATUS_EVENT_PREFIX = '[status-change]'

const route = useRoute()
const config = useRuntimeConfig()
const db = useRxdb()
const authStore = useAuthStore()
const locationStore = useLocationStore()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const adapter = useAttachmentAdapter()
const api = useApiClient()
const toast = useToast()
const { setBreadcrumbs } = useBreadcrumbs()
const { activeRole, hasPrivilege } = useRbacGuard()

const ticketId = route.params.id as string

const ticket = ref<Ticket | null>(null)
const comments = ref<TicketComment[]>([])
const attachments = ref<TicketAttachment[]>([])
const payments = ref<PaymentRecord[]>([])
const users = ref<LocationUser[]>([])
const commentBody = ref('')
const submittingComment = ref(false)
const uploadingAttachment = ref(false)
const updatingStatus = ref(false)
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const editModalOpen = ref(false)
const editSubmitting = ref(false)
const paymentModalOpen = ref(false)
const paymentSubmitting = ref(false)

const editForm = reactive({
  title: '',
  description: '',
  priority: 'medium',
  assignee: '',
  scheduledStartAt: '',
  scheduledEndAt: '',
  amount: '',
  currency: 'EUR'
})

const editErrors = reactive({
  title: '',
  amount: '',
  scheduledStartAt: '',
  scheduledEndAt: ''
})

const paymentForm = reactive({
  amount: '',
  provider: 'manual',
  date: '',
  notes: ''
})

const paymentErrors = reactive({
  amount: ''
})

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

const ticketCode = computed(() => formatTicketCode(ticketId))

const breadcrumbs = ref<BreadcrumbItem[]>([
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Tickets', to: '/tickets' },
  { label: ticketCode.value }
])

watch(
  () => ticket.value?.title,
  (title) => {
    const items: BreadcrumbItem[] = [
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

const prioritySelectOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

const currencyOptions = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' }
]

const paymentProviderOptions = [
  { value: 'manual', label: 'Cash / Card / Bank Transfer' },
  { value: 'stripe', label: 'Stripe' }
]

const assigneeSelectOptions = computed(() => [
  { value: '', label: '— Unassigned —' },
  ...users.value
    .map((user) => ({ value: user.id, label: user.name }))
    .sort((left, right) => left.label.localeCompare(right.label))
])

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

const getAllowedTransitions = (current: TicketStatus) => {
  const validForStatus = VALID_TRANSITIONS[current] ?? []

  if (activeRole.value === 'Owner') {
    return validForStatus
  }

  if (activeRole.value === 'Manager') {
    return validForStatus.filter((status) => status !== 'Paid')
  }

  if (activeRole.value === 'Technician') {
    const technicianTransitions = TECHNICIAN_TRANSITIONS[current] ?? []
    return technicianTransitions.filter((status) => validForStatus.includes(status))
  }

  return []
}

const isTicketStatus = (value: string): value is TicketStatus =>
  ALL_STATUSES.includes(value as TicketStatus)

const parseStatusEventComment = (body: string) => {
  if (!body.startsWith(STATUS_EVENT_PREFIX)) {
    return null
  }

  const payload = body.slice(STATUS_EVENT_PREFIX.length).trim()
  const [fromRaw, toRaw] = payload.split('->').map((part) => part.trim())

  if (!fromRaw || !toRaw || !isTicketStatus(fromRaw) || !isTicketStatus(toRaw)) {
    return null
  }

  return { from: fromRaw, to: toRaw }
}

const allowedNextStatuses = computed(() => {
  if (!ticket.value) {
    return []
  }

  return getAllowedTransitions(ticket.value.status)
})

const canStartJob = computed(() => allowedNextStatuses.value.includes('InProgress'))
const canCancel = computed(() => allowedNextStatuses.value.includes('Canceled'))

const statusDropdownItems = computed<DropdownItem[]>(() => {
  if (!ticket.value) {
    return []
  }

  return allowedNextStatuses.value.map((status) => ({
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
  }

  for (const comment of comments.value) {
    const statusEvent = parseStatusEventComment(comment.body)
    if (statusEvent) {
      items.push({
        id: `status-${comment.id}`,
        type: 'status_change',
        actor: {
          name: userNameById.value.get(comment.authorUserId) ?? `User ${comment.authorUserId.slice(0, 8)}`
        },
        content: `${ticketCode.value} moved from ${statusToLabel(statusEvent.from)} to ${statusToLabel(statusEvent.to)}`,
        timestamp: comment.createdAt
      })
      continue
    }

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
  if (!ticket.value || ticket.value.status === status || updatingStatus.value) {
    return
  }

  const currentStatus = ticket.value.status
  const allowedTransitions = getAllowedTransitions(currentStatus)

  if (!allowedTransitions.includes(status)) {
    toast.show({
      type: 'warning',
      message: 'This status transition is not allowed for your role'
    })
    return
  }

  updatingStatus.value = true

  try {
    await repository.saveTicket({
      id: ticket.value.id,
      status
    })

    await repository.addComment({
      ticketId: ticket.value.id,
      body: `${STATUS_EVENT_PREFIX} ${currentStatus}->${status}`
    })

    await syncStore.syncNow()

    toast.show({
      type: 'success',
      message: `Status updated to ${statusToLabel(status)}`
    })
  } catch {
    toast.show({
      type: 'error',
      message: 'Failed to update ticket status'
    })
  } finally {
    updatingStatus.value = false
  }
}

const cancelTicket = async () => {
  await updateTicketStatus('Canceled')
}

const resetEditErrors = () => {
  editErrors.title = ''
  editErrors.amount = ''
  editErrors.scheduledStartAt = ''
  editErrors.scheduledEndAt = ''
}

const resetPaymentErrors = () => {
  paymentErrors.amount = ''
}

const openEditModal = () => {
  if (!ticket.value) {
    return
  }

  resetEditErrors()
  editForm.title = ticket.value.title
  editForm.description = ticket.value.description ?? ''
  editForm.priority = ticket.value.priority?.toLowerCase() || 'medium'
  editForm.assignee = ticket.value.assignedToUserId ?? ''
  editForm.scheduledStartAt = ticket.value.scheduledStartAt ?? ''
  editForm.scheduledEndAt = ticket.value.scheduledEndAt ?? ''
  editForm.amount = formatAmountInput(ticket.value.totalAmountCents)
  editForm.currency = ticket.value.currency || 'EUR'
  editModalOpen.value = true
}

const validateEditForm = () => {
  resetEditErrors()

  let valid = true

  if (!editForm.title.trim()) {
    editErrors.title = 'Title is required'
    valid = false
  }

  const parsedAmount = parseAmountToCents(editForm.amount)
  if (Number.isNaN(parsedAmount)) {
    editErrors.amount = 'Amount must be a valid non-negative number'
    valid = false
  }

  const startTimestamp = editForm.scheduledStartAt ? new Date(editForm.scheduledStartAt).getTime() : null
  const endTimestamp = editForm.scheduledEndAt ? new Date(editForm.scheduledEndAt).getTime() : null

  if (startTimestamp !== null && Number.isNaN(startTimestamp)) {
    editErrors.scheduledStartAt = 'Invalid start date'
    valid = false
  }

  if (endTimestamp !== null && Number.isNaN(endTimestamp)) {
    editErrors.scheduledEndAt = 'Invalid end date'
    valid = false
  }

  if (
    startTimestamp !== null &&
    endTimestamp !== null &&
    !Number.isNaN(startTimestamp) &&
    !Number.isNaN(endTimestamp) &&
    endTimestamp < startTimestamp
  ) {
    editErrors.scheduledEndAt = 'End date must be after start date'
    valid = false
  }

  return valid
}

const submitEditTicket = async () => {
  if (!ticket.value || editSubmitting.value) {
    return
  }

  if (!validateEditForm()) {
    return
  }

  const parsedAmount = parseAmountToCents(editForm.amount)
  const patch: {
    title?: string
    description?: string | null
    priority?: string | null
    assignedToUserId?: string | null
    scheduledStartAt?: string | null
    scheduledEndAt?: string | null
    totalAmountCents?: number | null
    currency?: string
  } = {}

  const nextTitle = editForm.title.trim()
  if (nextTitle !== ticket.value.title) {
    patch.title = nextTitle
  }

  const nextDescription = editForm.description.trim() || null
  if (nextDescription !== ticket.value.description) {
    patch.description = nextDescription
  }

  const nextPriority = editForm.priority || null
  if (nextPriority !== ticket.value.priority) {
    patch.priority = nextPriority
  }

  const nextAssignee = editForm.assignee || null
  if (nextAssignee !== ticket.value.assignedToUserId) {
    patch.assignedToUserId = nextAssignee
  }

  const nextStart = editForm.scheduledStartAt || null
  if (nextStart !== ticket.value.scheduledStartAt) {
    patch.scheduledStartAt = nextStart
  }

  const nextEnd = editForm.scheduledEndAt || null
  if (nextEnd !== ticket.value.scheduledEndAt) {
    patch.scheduledEndAt = nextEnd
  }

  if (parsedAmount !== ticket.value.totalAmountCents) {
    patch.totalAmountCents = parsedAmount
  }

  if (editForm.currency !== ticket.value.currency) {
    patch.currency = editForm.currency
  }

  if (Object.keys(patch).length === 0) {
    editModalOpen.value = false
    return
  }

  editSubmitting.value = true

  try {
    await repository.saveTicket({
      id: ticket.value.id,
      ...patch
    })

    await syncStore.syncNow()
    editModalOpen.value = false

    toast.show({
      type: 'success',
      message: 'Ticket updated'
    })
  } catch {
    toast.show({
      type: 'error',
      message: 'Failed to update ticket'
    })
  } finally {
    editSubmitting.value = false
  }
}

const openPaymentModal = () => {
  resetPaymentErrors()
  paymentForm.provider = 'manual'
  paymentForm.date = new Date().toISOString().slice(0, 10)
  paymentForm.notes = ''

  const suggestedAmount = balanceAmountCents.value ?? ticket.value?.totalAmountCents ?? null
  paymentForm.amount = suggestedAmount !== null && suggestedAmount > 0 ? formatAmountInput(suggestedAmount) : ''
  paymentModalOpen.value = true
}

const submitPayment = async () => {
  if (!ticket.value || paymentSubmitting.value) {
    return
  }

  resetPaymentErrors()

  const amountCents = parseAmountToCents(paymentForm.amount)
  if (amountCents === null || Number.isNaN(amountCents) || amountCents <= 0) {
    paymentErrors.amount = 'Amount must be greater than 0'
    return
  }

  paymentSubmitting.value = true

  try {
    await repository.addPaymentRecord({
      ticketId: ticket.value.id,
      provider: paymentForm.provider as 'manual' | 'stripe',
      amountCents,
      currency: ticket.value.currency || 'EUR',
      status: paymentForm.provider === 'manual' ? 'Succeeded' : 'Pending'
    })

    if (paymentForm.notes.trim()) {
      const notePrefix = paymentForm.date ? `${paymentForm.date}: ` : ''

      await repository.addComment({
        ticketId: ticket.value.id,
        body: `Payment note — ${notePrefix}${paymentForm.notes.trim()}`
      })
    }

    await syncStore.syncNow()
    paymentModalOpen.value = false

    toast.show({
      type: 'success',
      message: 'Payment recorded'
    })
  } catch {
    toast.show({
      type: 'error',
      message: 'Failed to record payment'
    })
  } finally {
    paymentSubmitting.value = false
  }
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
    toast.show({
      type: 'success',
      message: 'Comment added'
    })
  } catch {
    toast.show({
      type: 'error',
      message: 'Failed to add comment'
    })
  } finally {
    submittingComment.value = false
  }
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const uploadFile = async (file: File) => {
  try {
    uploadingAttachment.value = true
    const payload = await adapter.fromFile(file)
    await adapter.uploadAttachment(ticketId, payload)
    await syncStore.syncNow()
    toast.show({
      type: 'success',
      message: `Uploaded ${file.name}`
    })
  } catch {
    toast.show({
      type: 'error',
      message: `Failed to upload ${file.name}`
    })
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
  isDragOver.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])

  if (files.length === 0) {
    return
  }

  for (const file of files) {
    await uploadFile(file)
  }
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

const formatBytes = (size: number) => {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
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
</script>
