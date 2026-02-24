<template>
  <AppShell>
    <section v-if="ticket" class="space-y-6">
      <div>
        <NuxtLink to="/tickets" class="text-sm text-emerald-700 hover:underline">← Back to tickets</NuxtLink>
        <h2 class="mt-2 text-2xl font-semibold">{{ ticket.title }}</h2>
        <p class="text-sm text-slate-600">Status: {{ ticket.status }}</p>
        <p v-if="ticket.description" class="mt-2 text-slate-700">{{ ticket.description }}</p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <h3 class="font-semibold">Comments</h3>
          <form class="mt-3 flex gap-2" @submit.prevent="addComment">
            <input
              v-model="commentBody"
              class="flex-1 rounded border border-slate-300 px-3 py-2"
              placeholder="Write a comment"
              required
            />
            <button class="rounded bg-ink px-3 py-2 text-white" type="submit">Add</button>
          </form>

          <ul class="mt-4 space-y-2">
            <li v-for="comment in comments" :key="comment.id" class="rounded border border-slate-100 bg-slate-50 p-3 text-sm">
              <p>{{ comment.body }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ new Date(comment.createdAt).toLocaleString() }}</p>
            </li>
            <li v-if="comments.length === 0" class="text-sm text-slate-500">No comments yet</li>
          </ul>
        </article>

        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <h3 class="font-semibold">Attachments</h3>

          <div class="mt-3 flex flex-wrap gap-2">
            <input ref="fileInput" class="hidden" type="file" @change="onWebFileSelected" />
            <button class="rounded bg-emerald-600 px-3 py-2 text-sm text-white" @click="openFileDialog">
              Upload file
            </button>
            <button class="rounded border border-slate-300 px-3 py-2 text-sm" @click="capturePhoto">
              Capture (mobile)
            </button>
          </div>

          <ul class="mt-4 space-y-2">
            <li
              v-for="attachment in attachments"
              :key="attachment.id"
              class="rounded border border-slate-100 bg-slate-50 p-3 text-sm"
            >
              <template v-if="attachment.storageKey.startsWith('pending/')">
                <p class="text-amber-700">{{ attachment.storageKey }} (pending upload)</p>
              </template>
              <a v-else :href="attachmentUrl(attachment.url)" class="text-emerald-700 hover:underline" target="_blank">
                {{ attachment.storageKey }}
              </a>
              <p class="text-xs text-slate-500">{{ attachment.mimeType }} · {{ attachment.size }} bytes</p>
            </li>
            <li v-if="attachments.length === 0" class="text-sm text-slate-500">No attachments yet</li>
          </ul>
        </article>
      </div>
    </section>

    <section v-else class="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
      Ticket not found in local database
    </section>
  </AppShell>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const db = useRxdb()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const adapter = useAttachmentAdapter()

const ticketId = route.params.id as string

const ticket = ref<any | null>(null)
const comments = ref<any[]>([])
const attachments = ref<any[]>([])
const commentBody = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

let ticketSub: any = null
let commentsSub: any = null
let attachmentsSub: any = null

const bindStreams = () => {
  ticketSub = db.collections.tickets.findOne(ticketId).$.subscribe((doc: any) => {
    ticket.value = doc?.toJSON() ?? null
  })

  commentsSub = db.collections.ticketComments
    .find({
      selector: {
        ticketId
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
        ticketId
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

onMounted(bindStreams)

onUnmounted(() => {
  ticketSub?.unsubscribe()
  commentsSub?.unsubscribe()
  attachmentsSub?.unsubscribe()
})

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
</script>
