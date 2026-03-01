<template>
  <section v-if="ticket" class="space-y-4">
    <JPageHeader
      class="hidden md:block"
      :title="ticketTitle"
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

    <section class="rounded-lg border border-slate-200 bg-white p-3 md:hidden">
      <button type="button" class="text-xs font-semibold text-slate-500 hover:text-slate-700" @click="goBackToTickets">
        ← Back to tickets
      </button>
      <div class="mt-2 flex items-start justify-between gap-3">
        <h1 class="text-lg font-bold text-ink">{{ ticketTitle }}</h1>
        <JBadge :variant="statusToBadgeVariant(ticket.status)">{{ statusToLabel(ticket.status) }}</JBadge>
      </div>
    </section>

    <div class="grid grid-cols-3 gap-2 md:hidden">
      <JButton size="sm" :disabled="!canStartJob || updatingStatus" @click="updateTicketStatus('InProgress')">
        Start Job
      </JButton>
      <JButton size="sm" variant="secondary" :disabled="!navigationUrl" @click="openNavigation">Navigate</JButton>
      <JButton size="sm" variant="secondary" :disabled="!customerPhone" @click="callCustomer">Call Customer</JButton>
    </div>

    <section class="space-y-2 md:hidden">
      <article class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink"
          @click="toggleMobileSection('details')"
        >
          <span>Details</span>
          <span class="text-slate-500">{{ mobileSections.details ? '−' : '+' }}</span>
        </button>
        <div v-if="mobileSections.details" class="border-t border-slate-200 p-4">
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
        </div>
      </article>

      <article class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink"
          @click="toggleMobileSection('description')"
        >
          <span>Description</span>
          <span class="text-slate-500">{{ mobileSections.description ? '−' : '+' }}</span>
        </button>
        <div v-if="mobileSections.description" class="border-t border-slate-200 p-4">
          <p class="text-sm text-ink-light">
            {{ ticket.description || 'No description provided.' }}
          </p>
        </div>
      </article>

      <article class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink"
          @click="toggleMobileSection('comments')"
        >
          <span>Comments</span>
          <span class="text-slate-500">{{ mobileSections.comments ? '−' : '+' }}</span>
        </button>
        <div v-if="mobileSections.comments" class="space-y-4 border-t border-slate-200 p-4">
          <JTimeline
            :items="timelineItems"
            :deletable-comment-ids="deletableCommentIds"
            :deleting-comment-id="deletingCommentId"
            @delete-comment="deleteComment"
          />

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
        </div>
      </article>
    </section>

    <div class="flex flex-col gap-6 md:flex-row">
      <div class="min-w-0 flex-[3] space-y-6">
        <JCard class="hidden md:block" title="Description">
          <p class="text-sm text-ink-light">
            {{ ticket.description || 'No description provided.' }}
          </p>
        </JCard>

        <JCard class="hidden md:block" title="Activity">
          <JTimeline
            :items="timelineItems"
            :deletable-comment-ids="deletableCommentIds"
            :deleting-comment-id="deletingCommentId"
            @delete-comment="deleteComment"
          />
        </JCard>

        <JCard class="hidden md:block">
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
              Drag & drop files here or click to upload
            </button>

            <div v-if="uploadProgressItems.length > 0" class="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div v-for="item in uploadProgressItems" :key="item.id" class="space-y-1">
                <div class="flex items-center justify-between gap-2 text-xs">
                  <p class="truncate text-ink">{{ item.name }}</p>
                  <p
                    :class="item.status === 'error' ? 'text-rose-600' : item.status === 'done' ? 'text-mint' : 'text-slate-500'"
                  >
                    {{ item.status === 'done' ? 'Done' : item.status === 'error' ? 'Failed' : `${item.progress}%` }}
                  </p>
                </div>
                <JProgress :value="item.progress" :max="100" :variant="item.status === 'error' ? 'flame' : 'mint'" />
              </div>
            </div>

            <div v-if="imageAttachments.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <article
                v-for="attachment in imageAttachments"
                :key="attachment.id"
                class="relative overflow-hidden rounded-md border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  class="aspect-video w-full bg-slate-100"
                  @click="openAttachmentPreview(attachment)"
                >
                  <img
                    :src="attachmentUrl(attachment.url)"
                    :alt="attachmentDisplayName(attachment)"
                    class="h-full w-full object-cover"
                  />
                </button>
                <div class="space-y-1 p-3 text-xs">
                  <p class="truncate font-semibold text-ink">{{ attachmentDisplayName(attachment) }}</p>
                  <p class="text-slate-500">{{ attachment.mimeType }} · {{ formatBytes(attachment.size) }}</p>
                  <p v-if="isPendingAttachment(attachment)" class="text-amber-700">Pending upload</p>
                </div>

                <button
                  type="button"
                  class="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs text-rose-600 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="deletingAttachmentId === attachment.id || uploadingAttachment"
                  @click="deleteAttachment(attachment)"
                >
                  Delete
                </button>
              </article>
            </div>

            <ul v-if="fileAttachments.length > 0" class="space-y-2">
              <li
                v-for="attachment in fileAttachments"
                :key="attachment.id"
                class="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-ink">
                    {{ fileIcon(attachment.mimeType) }} {{ attachmentDisplayName(attachment) }}
                  </p>
                  <p class="text-xs text-slate-500">{{ attachment.mimeType }} · {{ formatBytes(attachment.size) }}</p>
                  <p v-if="isPendingAttachment(attachment)" class="text-xs text-amber-700">Pending upload</p>
                </div>

                <button
                  type="button"
                  class="shrink-0 rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="deletingAttachmentId === attachment.id || uploadingAttachment"
                  @click="deleteAttachment(attachment)"
                >
                  Delete
                </button>
              </li>
            </ul>

            <p v-if="attachments.length === 0" class="text-sm text-slate-500">No attachments yet.</p>
          </div>
        </JCard>
      </div>

      <div class="w-full space-y-4 md:max-w-[300px] lg:max-w-[320px]">
        <JCard class="hidden md:block" title="Details">
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

        <TicketChecklistCard :items="checklistItems" :disabled="checklistSaving" @toggle="onChecklistToggle" />
      </div>
    </div>

    <input ref="fileInput" class="hidden" type="file" multiple @change="onWebFileSelected" />

    <JModal v-model="attachmentPreviewOpen" title="Attachment Preview" size="lg">
      <div class="space-y-3">
        <img
          v-if="previewAttachment"
          :src="attachmentUrl(previewAttachment.url)"
          :alt="attachmentDisplayName(previewAttachment)"
          class="max-h-[65vh] w-full rounded-md border border-slate-200 object-contain"
        />
        <div v-if="previewAttachment" class="text-xs text-slate-500">
          {{ attachmentDisplayName(previewAttachment) }} · {{ previewAttachment.mimeType }} ·
          {{ formatBytes(previewAttachment.size) }}
        </div>
      </div>
    </JModal>

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
import type { BreadcrumbItem, DropdownItem } from '~/types/ui'
import {
  listAllowedStatusTransitions,
  type PaymentRecord,
  type Ticket,
  type TicketAttachment,
  type TicketChecklistItem,
  type TicketStatus
} from '@jtrack/shared'
import {
  priorityToBadgeVariant,
  statusToBadgeVariant,
  statusToLabel
} from '~/utils/ticket-status'
import {
  formatAmountInput,
  formatDateTime,
  formatMoney,
  formatTicketNumber,
  formatPriorityLabel,
  parseAmountToCents
} from '~/utils/format'

interface LocationUser {
  id: string
  name: string
}

interface UploadProgressItem {
  id: string
  name: string
  progress: number
  status: 'uploading' | 'done' | 'error'
}

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
const attachments = ref<TicketAttachment[]>([])
const payments = ref<PaymentRecord[]>([])
const users = ref<LocationUser[]>([])
const commentBody = ref('')
const submittingComment = ref(false)
const uploadingAttachment = ref(false)
const updatingStatus = ref(false)
const checklistSaving = ref(false)
const deletingCommentId = ref<string | null>(null)
const deletingAttachmentId = ref<string | null>(null)
const attachmentPreviewOpen = ref(false)
const previewAttachment = ref<TicketAttachment | null>(null)
const uploadProgressItems = ref<UploadProgressItem[]>([])
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const mobileSections = reactive({
  details: false,
  description: true,
  comments: true
})
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

const DEFAULT_CHECKLIST_ITEMS: TicketChecklistItem[] = [
  { id: 'inspect', label: 'Inspect unit', checked: false },
  { id: 'refrigerant', label: 'Check refrigerant levels', checked: false },
  { id: 'thermostat', label: 'Test thermostat', checked: false },
  { id: 'signoff', label: 'Customer sign-off', checked: false }
]

const checklistItems = ref<TicketChecklistItem[]>([])

let ticketSub: { unsubscribe: () => void } | null = null
let attachmentsSub: { unsubscribe: () => void } | null = null
let paymentsSub: { unsubscribe: () => void } | null = null

const breadcrumbs = ref<BreadcrumbItem[]>([
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Tickets', to: '/tickets' },
  { label: 'Ticket' }
])

watch(
  () => ticket.value?.title,
  (title) => {
    breadcrumbs.value = [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Tickets', to: '/tickets' },
      { label: title || 'Ticket' }
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

const ticketTitle = computed(() => {
  if (!ticket.value) {
    return 'Ticket'
  }

  return `${formatTicketNumber(ticket.value.ticketNumber, ticket.value.id)} ${ticket.value.title}`
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
const imageAttachments = computed(() => attachments.value.filter((attachment) => isImageAttachment(attachment)))
const fileAttachments = computed(() => attachments.value.filter((attachment) => !isImageAttachment(attachment)))

const { timelineItems } = useTicketActivity({
  ticketId: computed(() => ticketId),
  users: computed(() => users.value)
})

const deletableCommentIds = computed(() => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) {
    return []
  }

  return timelineItems.value
    .filter((item) => item.type === 'comment' && item.commentId && item.actor.id === currentUserId)
    .map((item) => item.commentId as string)
})

const getAllowedTransitions = (current: TicketStatus) => {
  if (!activeRole.value) {
    return []
  }

  return listAllowedStatusTransitions(current, activeRole.value)
}

const allowedNextStatuses = computed(() => {
  if (!ticket.value) {
    return []
  }

  return getAllowedTransitions(ticket.value.status)
})

const canStartJob = computed(() => allowedNextStatuses.value.includes('InProgress'))
const canCancel = computed(() => allowedNextStatuses.value.includes('Canceled'))
const navigationUrl = computed(() => {
  const address = locationStore.activeLocation?.address?.trim()
  if (!address) {
    return ''
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
})
const customerPhone = computed(() => {
  const description = ticket.value?.description ?? ''
  const match = description.match(/(\+?\d[\d\s\-()]{6,}\d)/)
  if (!match?.[1]) {
    return ''
  }

  return match[1].replace(/[^\d+]/g, '')
})

const statusDropdownItems = computed<DropdownItem[]>(() => {
  if (!ticket.value) {
    return []
  }

  return allowedNextStatuses.value.map((status) => ({
    label: statusToLabel(status),
    action: () => updateTicketStatus(status)
  }))
})

const bindStreams = () => {
  ticketSub?.unsubscribe()
  attachmentsSub?.unsubscribe()
  paymentsSub?.unsubscribe()

  if (!locationStore.activeLocationId) {
    ticket.value = null
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
watch(
  () => ticket.value?.checklist,
  (value) => {
    const source = value && value.length > 0 ? value : DEFAULT_CHECKLIST_ITEMS
    checklistItems.value = source.map((item) => ({
      id: item.id,
      label: item.label,
      checked: item.checked
    }))
  },
  { immediate: true, deep: true }
)

onUnmounted(() => {
  ticketSub?.unsubscribe()
  attachmentsSub?.unsubscribe()
  paymentsSub?.unsubscribe()
})

const onChecklistToggle = async ({ id, checked }: { id: string; checked: boolean }) => {
  if (!ticket.value || checklistSaving.value) {
    return
  }

  const previous = checklistItems.value
  const next = checklistItems.value.map((item) => (item.id === id ? { ...item, checked } : item))
  checklistItems.value = next
  checklistSaving.value = true

  try {
    await repository.saveTicket({
      id: ticket.value.id,
      checklist: next
    })
    await syncStore.syncNow()
  } catch {
    checklistItems.value = previous
    toast.show({
      type: 'error',
      message: 'Failed to update checklist'
    })
  } finally {
    checklistSaving.value = false
  }
}

const updateTicketStatus = async (status: TicketStatus) => {
  if (!ticket.value || ticket.value.status === status || updatingStatus.value) {
    return
  }

  const allowedTransitions = getAllowedTransitions(ticket.value.status)

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

const toggleMobileSection = (section: keyof typeof mobileSections) => {
  mobileSections[section] = !mobileSections[section]
}

const goBackToTickets = async () => {
  await navigateTo('/tickets')
}

const openNavigation = () => {
  if (!navigationUrl.value) {
    toast.show({
      type: 'warning',
      message: 'Customer address is not available'
    })
    return
  }

  window.open(navigationUrl.value, '_blank', 'noopener')
}

const callCustomer = () => {
  if (!customerPhone.value) {
    toast.show({
      type: 'warning',
      message: 'Customer phone was not found in ticket description'
    })
    return
  }

  window.location.href = `tel:${customerPhone.value}`
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

const deleteComment = async (commentId: string) => {
  if (deletingCommentId.value) {
    return
  }

  if (typeof window !== 'undefined') {
    const confirmed = window.confirm('Delete this comment?')
    if (!confirmed) {
      return
    }
  }

  deletingCommentId.value = commentId

  try {
    await repository.deleteComment(commentId)
    await syncStore.syncNow()
    toast.show({
      type: 'success',
      message: 'Comment deleted'
    })
  } catch {
    toast.show({
      type: 'error',
      message: 'Failed to delete comment'
    })
  } finally {
    deletingCommentId.value = null
  }
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const updateUploadProgress = (id: string, patch: Partial<UploadProgressItem>) => {
  uploadProgressItems.value = uploadProgressItems.value.map((item) =>
    item.id === id ? { ...item, ...patch } : item
  )
}

const uploadFile = async (file: File) => {
  const uploadId = crypto.randomUUID()
  uploadProgressItems.value = [
    {
      id: uploadId,
      name: file.name,
      progress: 10,
      status: 'uploading'
    },
    ...uploadProgressItems.value
  ]

  try {
    updateUploadProgress(uploadId, { progress: 35 })
    const payload = await adapter.fromFile(file)
    updateUploadProgress(uploadId, { progress: 75 })
    await adapter.uploadAttachment(ticketId, payload)
    updateUploadProgress(uploadId, { progress: 100, status: 'done' })
    return true
  } catch {
    updateUploadProgress(uploadId, { progress: 100, status: 'error' })
    return false
  }
}

const uploadFiles = async (files: File[]) => {
  if (files.length === 0 || uploadingAttachment.value) {
    return
  }

  uploadingAttachment.value = true
  let uploadedCount = 0

  try {
    for (const file of files) {
      const success = await uploadFile(file)
      if (success) {
        uploadedCount += 1
      }
    }

    if (uploadedCount > 0) {
      await syncStore.syncNow()
      toast.show({
        type: 'success',
        message:
          uploadedCount === files.length
            ? `Uploaded ${uploadedCount} file${uploadedCount === 1 ? '' : 's'}`
            : `Uploaded ${uploadedCount} of ${files.length} files`
      })
    }

    if (uploadedCount < files.length) {
      toast.show({
        type: 'error',
        message: `${files.length - uploadedCount} file${files.length - uploadedCount === 1 ? '' : 's'} failed`
      })
    }
  } finally {
    uploadingAttachment.value = false
  }
}

const onWebFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const files = Array.from(input?.files ?? [])

  if (files.length === 0) {
    return
  }

  await uploadFiles(files)

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

  await uploadFiles(files)
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

const openAttachmentPreview = (attachment: TicketAttachment) => {
  previewAttachment.value = attachment
  attachmentPreviewOpen.value = true
}

const attachmentDisplayName = (attachment: TicketAttachment) => {
  const trimmed = attachment.storageKey.trim()
  if (!trimmed) {
    return attachment.id
  }

  const parts = trimmed.split('/')
  return parts[parts.length - 1] || trimmed
}

const isPendingAttachment = (attachment: TicketAttachment) =>
  attachment.storageKey.startsWith('pending/')

const deleteAttachment = async (attachment: TicketAttachment) => {
  if (deletingAttachmentId.value || uploadingAttachment.value) {
    return
  }

  if (typeof window !== 'undefined') {
    const confirmed = window.confirm(`Delete attachment "${attachmentDisplayName(attachment)}"?`)
    if (!confirmed) {
      return
    }
  }

  deletingAttachmentId.value = attachment.id

  try {
    await repository.deleteAttachment(attachment.id)
    await syncStore.syncNow()

    if (previewAttachment.value?.id === attachment.id) {
      attachmentPreviewOpen.value = false
      previewAttachment.value = null
    }

    toast.show({
      type: 'success',
      message: 'Attachment deleted'
    })
  } catch {
    toast.show({
      type: 'error',
      message: 'Failed to delete attachment'
    })
  } finally {
    deletingAttachmentId.value = null
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

const fileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return '🖼️'
  }

  if (mimeType.includes('pdf')) {
    return '📄'
  }

  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
    return '📊'
  }

  if (mimeType.includes('word') || mimeType.includes('text')) {
    return '📝'
  }

  return '📎'
}

</script>
