<template>
  <section v-if="ticket">
    <div class="flex flex-col gap-6 lg:flex-row">
      <!-- Left column — main content -->
      <div class="min-w-0 flex-[3] space-y-6">
        <div class="rounded-lg border border-slate-200 bg-white px-5 py-4">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <input
                v-if="editing"
                v-model="editForm.title"
                class="w-full bg-transparent text-xl font-bold text-ink outline-none placeholder:text-slate-300"
                placeholder="Ticket title"
              />
              <h1
                v-else
                class="cursor-pointer text-xl font-bold text-ink"
                @click="startEditing"
              >
                {{ ticket.title }}
              </h1>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <template v-if="editing">
                <JButton variant="secondary" size="sm" @click="cancelEditing">Cancel</JButton>
                <JButton size="sm" :loading="saving" @click="saveEdits">Save</JButton>
              </template>
              <JButton v-else variant="secondary" size="sm" @click="startEditing">
                <template #icon>
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </template>
                Edit
              </JButton>
            </div>
          </div>
          <div>
            <textarea
              v-if="editing"
              v-model="editForm.description"
              class="w-full resize-none bg-transparent text-base leading-relaxed text-slate-700 outline-none placeholder:text-slate-300"
              placeholder="Add a description…"
              rows="6"
            />
            <p
              v-else-if="ticket.description"
              class="cursor-pointer whitespace-pre-wrap text-base leading-relaxed text-slate-700"
              @click="startEditing"
            >
              {{ ticket.description }}
            </p>
            <p
              v-else
              class="cursor-pointer text-base italic text-slate-300"
              @click="startEditing"
            >
              Click to add a description…
            </p>
          </div>
        </div>

        <!-- Activity / Comments -->
        <JCard>
          <form class="mb-5 flex items-start gap-3" @submit.prevent="addComment">
            <JTextarea
              v-model="commentBody"
              placeholder="Write a comment…"
              :rows="1"
              class="flex-1"
            />
            <JButton type="submit" class="mt-[1px]" :disabled="!commentBody.trim()">Send</JButton>
          </form>

          <div v-if="comments.length" class="space-y-4 border-t border-slate-100 pt-5">
            <article
              v-for="comment in comments"
              :key="comment.id"
              class="flex gap-4"
            >
              <JAvatar :name="comment.userId ?? 'User'" size="md" class="mt-1 shrink-0" />
              <div class="min-w-0 flex-1 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <div class="mb-1.5 flex items-center gap-2">
                  <span class="text-sm font-semibold text-slate-900">{{ comment.userId?.slice(0, 8) ?? 'User' }}</span>
                  <span class="text-sm text-slate-400" :title="formatTooltipDate(comment.createdAt)">{{ timeAgo(comment.createdAt) }}</span>
                </div>
                <p class="text-base leading-relaxed text-slate-700">{{ comment.body }}</p>
              </div>
            </article>
          </div>
          <p v-else class="border-t border-slate-100 pt-5 text-center text-base text-slate-400">
            No comments yet. Start the conversation above.
          </p>
        </JCard>

      </div>

      <!-- Right column — sidebar -->
      <div class="w-full space-y-6 lg:max-w-[320px]">
        <!-- Details -->
        <JCard title="Details">
          <dl class="space-y-4">
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">Status</dt>
              <dd><JBadge :variant="statusVariant(ticket.status)">{{ ticket.status }}</JBadge></dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">Priority</dt>
              <dd v-if="editing">
                <JSelect v-model="editForm.priority" :options="priorityOptions" placeholder="None" class="[&_select]:py-1 [&_select]:text-xs" />
              </dd>
              <dd v-else><JBadge :variant="priorityVariant(ticket.priority)">{{ ticket.priority ?? 'None' }}</JBadge></dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">Created</dt>
              <dd class="text-base text-slate-700" :title="formatTooltipDate(ticket.createdAt)">{{ timeAgo(ticket.createdAt) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">Updated</dt>
              <dd class="text-base text-slate-700" :title="formatTooltipDate(ticket.updatedAt)">{{ timeAgo(ticket.updatedAt) }}</dd>
            </div>
          </dl>
        </JCard>

        <!-- Attachments -->
        <JCard title="Attachments">
          <template #action>
            <input ref="fileInput" class="hidden" type="file" @change="onWebFileSelected" />
            <div class="flex gap-1.5">
              <JButton variant="ghost" size="sm" @click="openFileDialog">
                <template #icon>
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </template>
                Upload
              </JButton>
              <JButton variant="ghost" size="sm" @click="capturePhoto">
                <template #icon>
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </template>
                Capture
              </JButton>
            </div>
          </template>

          <ul v-if="attachments.length" class="space-y-2">
            <li
              v-for="attachment in attachments"
              :key="attachment.id"
              class="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
            >
              <div class="flex size-8 shrink-0 items-center justify-center rounded bg-slate-200">
                <svg class="size-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <template v-if="attachment.storageKey?.startsWith('pending/')">
                  <p class="truncate text-sm font-medium text-amber-600">{{ attachment.storageKey }}</p>
                  <p class="text-xs text-amber-500">Pending upload</p>
                </template>
                <template v-else>
                  <a
                    :href="attachmentUrl(attachment.url)"
                    class="block truncate text-sm font-medium text-slate-900 hover:text-mint-700 hover:underline"
                    target="_blank"
                  >
                    {{ attachment.storageKey }}
                  </a>
                  <p class="text-xs text-slate-400">{{ attachment.mimeType }} · {{ formatBytes(attachment.size) }}</p>
                </template>
              </div>
            </li>
          </ul>
          <p v-else class="text-center text-sm text-slate-400">No attachments yet.</p>
        </JCard>
      </div>
    </div>
  </section>

  <section v-else class="rounded-xl border border-slate-200 bg-white p-8 text-center text-base text-slate-500">
    Ticket not found in local database.
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
const editForm = reactive({ title: '', description: '', priority: '' })
const priorityOptions = [
  { value: '', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

let ticketSub: any = null
let commentsSub: any = null
let attachmentsSub: any = null

watch(
  () => ticket.value?.title,
  (title) => {
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Tickets', to: '/tickets' },
      { label: title || `#${ticketId}` }
    ]
    setBreadcrumbs(items)
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
      editForm.priority = t.priority ?? ''
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
  editForm.priority = ticket.value?.priority ?? ''
  editing.value = true
}

function cancelEditing() {
  editForm.title = ticket.value?.title ?? ''
  editForm.description = ticket.value?.description ?? ''
  editForm.priority = ticket.value?.priority ?? ''
  editing.value = false
}

async function saveEdits() {
  if (!ticket.value) return
  saving.value = true
  try {
    await repository.saveTicket({
      id: ticket.value.id,
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority || undefined
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

function formatTooltipDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { weekday: 'long' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const date = d.getDate()
  const hour = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${day} ${month} ${date}, ${hour}`
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
