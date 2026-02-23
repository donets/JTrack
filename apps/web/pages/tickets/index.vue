<template>
  <AppShell>
    <section class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Tickets</h2>
        <p class="text-sm text-slate-500">Data source: RxDB (offline-first)</p>
      </div>

      <form class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4" @submit.prevent="createTicket">
        <input v-model="form.title" class="rounded border border-slate-300 px-3 py-2" placeholder="Title" required />
        <input
          v-model="form.description"
          class="rounded border border-slate-300 px-3 py-2"
          placeholder="Description"
        />
        <select v-model="form.priority" class="rounded border border-slate-300 px-3 py-2">
          <option value="">Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button class="rounded bg-emerald-600 px-3 py-2 text-white" type="submit">Create ticket</button>
      </form>

      <div class="rounded-xl border border-slate-200 bg-white">
        <div class="flex items-center justify-end border-b border-slate-100 px-4 py-3">
          <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="New">New</option>
            <option value="Scheduled">Scheduled</option>
            <option value="InProgress">In progress</option>
            <option value="Done">Done</option>
            <option value="Invoiced">Invoiced</option>
            <option value="Paid">Paid</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-slate-600">Title</th>
              <th class="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th class="px-4 py-3 text-left font-medium text-slate-600">Priority</th>
              <th class="px-4 py-3 text-left font-medium text-slate-600">Updated</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="ticket in visibleTickets" :key="ticket.id" class="hover:bg-slate-50">
              <td class="px-4 py-3">
                <NuxtLink :to="`/tickets/${ticket.id}`" class="font-medium text-emerald-700 hover:underline">
                  {{ ticket.title }}
                </NuxtLink>
              </td>
              <td class="px-4 py-3">{{ ticket.status }}</td>
              <td class="px-4 py-3">{{ ticket.priority ?? '-' }}</td>
              <td class="px-4 py-3">{{ new Date(ticket.updatedAt).toLocaleString() }}</td>
            </tr>
            <tr v-if="visibleTickets.length === 0">
              <td class="px-4 py-6 text-center text-slate-500" colspan="4">No tickets in local store</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
const locationStore = useLocationStore()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const db = useRxdb()

const tickets = ref<any[]>([])
let subscription: any = null

const form = reactive({
  title: '',
  description: '',
  priority: ''
})
const statusFilter = ref('')

const visibleTickets = computed(() =>
  tickets.value
    .filter((ticket) => !ticket.deletedAt)
    .filter((ticket) => (statusFilter.value ? ticket.status === statusFilter.value : true))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
)

const subscribeToTickets = () => {
  subscription?.unsubscribe()

  if (!locationStore.activeLocationId) {
    tickets.value = []
    return
  }

  subscription = db.collections.tickets
    .find({
      selector: {
        locationId: locationStore.activeLocationId
      }
    })
    .$
    .subscribe((docs: any[]) => {
      tickets.value = docs.map((doc) => doc.toJSON())
    })
}

watch(() => locationStore.activeLocationId, subscribeToTickets, { immediate: true })

onUnmounted(() => {
  subscription?.unsubscribe()
})

const createTicket = async () => {
  await repository.saveTicket({
    title: form.title,
    description: form.description || undefined,
    priority: form.priority || undefined,
    status: 'New'
  })

  form.title = ''
  form.description = ''
  form.priority = ''

  await syncStore.syncNow()
}
</script>
