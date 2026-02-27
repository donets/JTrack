<template>
  <section v-if="ticket" class="space-y-6">
    <JPageHeader
      :title="editing ? '' : ticket.title"
      :breadcrumbs="breadcrumbs"
    >
      <template v-if="editing" #title>
        <input
          v-model="editForm.title"
          class="w-full border-b-2 border-mint-500 bg-transparent text-xl font-bold text-slate-900 outline-none placeholder:text-slate-400"
          placeholder="Ticket title"
        />
      </template>
      <template #status>
        <JBadge :variant="statusVariant(ticket.status)" size="sm">
          {{ ticket.status }}
        </JBadge>
      </template>
      <template #actions>
        <div class="flex items-center gap-2">
          <template v-if="editing">
            <JButton variant="secondary" size="sm" @click="cancelEditing">Cancel</JButton>
            <JButton size="sm" :loading="saving" @click="saveEdits">Save</JButton>
          </template>
          <JButton v-else variant="secondary" size="sm" @click="startEditing">Edit</JButton>
        </div>
      </template>
    </JPageHeader>

    <div class="flex flex-col gap-6 lg:flex-row">
      <!-- Left column — main content -->
      <div class="min-w-0 flex-[3] space-y-5">
        <!-- Description -->
        <JCard title="Description">
          <template v-if="editing">
            <JTextarea
              v-model="editForm.description"
              placeholder="Add a description…"
              :rows="5"
            />
          </template>
          <template v-else>
            <p v-if="ticket.description" class="whitespace-pre-wrap text-sm text-slate-700">
              {{ ticket.description }}
            </p>
            <p v-else class="text-sm italic text-slate-400">No description</p>
          </template>
        </JCard>

        <!-- Activity / Comments -->
        <JCard title="Activity">
          <form class="flex gap-2" @submit.prevent="addComment">
            <JTextarea
              v-model="commentBody"
              placeholder="Write a comment…"
              :rows="2"
              class="flex-1"
            />
            <JButton type="submit" size="sm" class="self-end">Send</JButton>
          </form>

          <ul class="mt-4 space-y-3">
            <li
              v-for="comment in comments"
              :key="comment.id"
              class="flex gap-3"
            >
              <JAvatar :name="comment.userId ?? 'User'" size="sm" class="mt-0.5 shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline gap-2">
                  <span class="text-sm font-medium text-slate-900">{{ comment.userId?.slice(0, 8) ?? 'User' }}</span>
                  <span class="text-xs text-slate-400">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="mt-0.5 text-sm text-slate-700">{{ comment.body }}</p>
              </div>
            </li>
            <li v-if="comments.length === 0" class="text-sm text-slate-400">No comments yet</li>
          </ul>
        </JCard>

        <!-- Attachments -->
        <JCard title="Attachments">
          <template #action>
            <div class="flex gap-2">
              <input ref="fileInput" class="hidden" type="file" @change="onWebFileSelected" />
              <JButton variant="secondary" size="sm" @click="openFileDialog">Upload</JButton>
              <JButton variant="secondary" size="sm" @click="capturePhoto">Capture</JButton>
            </div>
          </template>

          <ul v-if="attachments.length" class="space-y-2">
            <li
              v-for="attachment in attachments"
              :key="attachment.id"
              class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
            >
              <svg class="size-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              <div class="min-w-0 flex-1">
                <template v-if="attachment.storageKey?.startsWith('pending/')">
                  <p class="truncate font-medium text-amber-600">{{ attachment.storageKey }}</p>
                  <JBadge variant="flame" size="sm">Pending upload</JBadge>
                </template>
                <template v-else>
                  <a
                    :href="attachmentUrl(attachment.url)"
                    class="block truncate font-medium text-mint-700 hover:underline"
                    target="_blank"
                  >
                    {{ attachment.storageKey }}
                  </a>
                </template>
                <p class="text-xs text-slate-400">{{ attachment.mimeType }} · {{ formatBytes(attachment.size) }}</p>
              </div>
            </li>
          </ul>
          <p v-else class="text-sm italic text-slate-400">No attachments</p>
        </JCard>
      </div>

      <!-- Right column — sidebar -->
      <div class="w-full space-y-5 lg:max-w-[300px]">
        <!-- Details -->
        <JCard title="Details">
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Status</dt>
              <dd><JBadge :variant="statusVariant(ticket.status)" size="sm">{{ ticket.status }}</JBadge></dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Priority</dt>
              <dd><JBadge :variant="priorityVariant(ticket.priority)" size="sm">{{ ticket.priority ?? 'None' }}</JBadge></dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Created</dt>
              <dd class="text-slate-700">{{ formatDate(ticket.createdAt) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Updated</dt>
              <dd class="text-slate-700">{{ formatDate(ticket.updatedAt) }}</dd>
            </div>
          </dl>
        </JCard>

        <!-- Financial -->
        <JCard title="Financial">
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Amount</dt>
              <dd class="font-medium text-slate-900">
                {{ ticket.totalAmountCents ? formatCurrency(ticket.totalAmountCents, ticket.currency) : '—' }}
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Currency</dt>
              <dd class="text-slate-700">{{ ticket.currency ?? '—' }}</dd>
            </div>
          </dl>
        </JCard>
      </div>
    </div>
  </section>

  <section v-else class="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
    Ticket not found in local database
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const route = useRoute()
const config = useRuntimeConfig()
const db = useRxdb()
const locationStore = useLocationStore()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const adapter = useAttachmentAdapter()
const { setBreadcrumbs } = useBreadcrumbs()

const ticketId = route.params.id as string

const ticket = ref<any | null>(null)
const comments = ref<any[]>([])
const attachments = ref<any[]>([])
const commentBody = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Inline editing state
const editing = ref(false)
const saving = ref(false)
const editForm = reactive({ title: '', description: '' })

let ticketSub: any = null
let commentsSub: any = null
let attachmentsSub: any = null

const breadcrumbs = ref<BreadcrumbItem[]>([
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Tickets', to: '/tickets' },
  { label: `#${ticketId}` }
])

watch(
  () => ticket.value?.title,
  (title) => {
    breadcrumbs.value = [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Tickets', to: '/tickets' },
      { label: title || `#${ticketId}` }
    ]
    setBreadcrumbs(breadcrumbs.value)
  },
  { immediate: true }
)

// Sync editForm when ticket data changes (only if not currently editing)
watch(
  () => ticket.value,
  (t) => {
    if (t && !editing.value) {
      editForm.title = t.title ?? ''
      editForm.description = t.description ?? ''
    }
  },
  { immediate: true }
)

const bindStreams = () => {
  ticketSub?.unsubscribe()
  commentsSub?.unsubscribe()
  attachmentsSub?.unsubscribe()

  if (!locationStore.activeLocationId) {
    ticket.value = null
    comments.value = []
    attachments.value = []
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
    .subscribe((doc: any | null) => {
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
    .subscribe((docs: any[]) => {
      comments.value = docs
        .map((doc) => doc.toJSON())
        .filter((comment) => !comment.deletedAt)
        .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
    })

  attachmentsSub = db.collections.ticketAttachments
    .find({
      selector: {
        ticketId,
        locationId: locationStore.activeLocationId
      }
    })
    .$
    .subscribe((docs: any[]) => {
      attachments.value = docs
        .map((doc) => doc.toJSON())
        .filter((attachment) => !attachment.deletedAt)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    })
}

watch(() => locationStore.activeLocationId, bindStreams, { immediate: true })

onUnmounted(() => {
  ticketSub?.unsubscribe()
  commentsSub?.unsubscribe()
  attachmentsSub?.unsubscribe()
})

// --- Inline editing ---

function startEditing() {
  editForm.title = ticket.value?.title ?? ''
  editForm.description = ticket.value?.description ?? ''
  editing.value = true
}

function cancelEditing() {
  editForm.title = ticket.value?.title ?? ''
  editForm.description = ticket.value?.description ?? ''
  editing.value = false
}

async function saveEdits() {
  if (!ticket.value) return
  saving.value = true
  try {
    await repository.saveTicket({
      id: ticket.value.id,
      title: editForm.title,
      description: editForm.description
    })
    editing.value = false
    await syncStore.syncNow()
  } finally {
    saving.value = false
  }
}

// --- Comments & Attachments (unchanged logic) ---

const addComment = async () => {
  if (!commentBody.value.trim()) {
    return
  }

  await repository.addComment({
    ticketId,
    body: commentBody.value
  })

  commentBody.value = ''
  await syncStore.syncNow()
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const onWebFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  const payload = await adapter.fromFile(file)
  await adapter.uploadAttachment(ticketId, payload)
  await syncStore.syncNow()
  input.value = ''
}

const capturePhoto = async () => {
  try {
    const payload = await adapter.captureFromDevice()
    await adapter.uploadAttachment(ticketId, payload)
    await syncStore.syncNow()
  } catch {
    // Ignore when camera is unavailable outside mobile shell
  }
}

const attachmentUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return `${config.public.apiBase}${url}`
}

// --- Helpers ---

function statusVariant(s: string): 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist' {
  const map: Record<string, 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist'> = {
    New: 'sky',
    Scheduled: 'violet',
    InProgress: 'flame',
    Done: 'mint',
    Invoiced: 'sky',
    Paid: 'mint',
    Canceled: 'mist'
  }
  return map[s] ?? 'mist'
}

function priorityVariant(p: string | null | undefined): 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist' {
  if (!p) return 'mist'
  const map: Record<string, 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist'> = {
    high: 'rose',
    medium: 'flame',
    low: 'mist'
  }
  return map[p.toLowerCase()] ?? 'mist'
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatCurrency(cents: number, currency?: string): string {
  const amount = cents / 100
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount)
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
