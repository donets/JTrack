<template>
  <section class="space-y-5">
    <JPageHeader
      title="Tickets"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <button
          class="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90"
          @click="showModal = true"
        >
          + New Ticket
        </button>
      </template>
    </JPageHeader>

    <!-- Create Ticket Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal" />
        <div class="relative w-full max-w-[560px] rounded-xl bg-white shadow-2xl" @click.stop>
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 class="text-lg font-semibold">Create New Ticket</h3>
            <button class="text-slate-400 transition hover:text-slate-600" @click="closeModal">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <form class="px-6 py-5" @submit.prevent="createTicket">
            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Title <span class="text-red-400">*</span></label>
                <input
                  v-model="form.title"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Brief description of the job"
                  required
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Detailed notes, customer info, special instructions..."
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">Priority</label>
                  <select
                    v-model="form.priority"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">Assign to</label>
                  <select
                    disabled
                    class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
                  >
                    <option>Unassigned</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">Scheduled start</label>
                  <input
                    v-model="form.scheduledStartAt"
                    type="datetime-local"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">Scheduled end</label>
                  <input
                    v-model="form.scheduledEndAt"
                    type="datetime-local"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{{ form.currency === 'USD' ? '$' : '€' }}</span>
                    <input
                      v-model="form.amount"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-full rounded-lg border border-slate-200 py-2 pl-7 pr-3 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">Currency</label>
                  <select
                    v-model="form.currency"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                @click="closeModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90"
              >
                Create Ticket
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

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
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const locationStore = useLocationStore()
const repository = useOfflineRepository()
const syncStore = useSyncStore()
const db = useRxdb()
const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Tickets', to: '/tickets' }
]

setBreadcrumbs(breadcrumbs)

const tickets = ref<any[]>([])
let subscription: any = null

const showModal = ref(false)
const form = reactive({
  title: '',
  description: '',
  priority: '',
  scheduledStartAt: '',
  scheduledEndAt: '',
  amount: '',
  currency: 'EUR'
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

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.priority = ''
  form.scheduledStartAt = ''
  form.scheduledEndAt = ''
  form.amount = ''
  form.currency = 'EUR'
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const createTicket = async () => {
  const amountCents = form.amount ? Math.round(parseFloat(form.amount) * 100) : undefined

  await repository.saveTicket({
    title: form.title,
    description: form.description || undefined,
    priority: form.priority || undefined,
    scheduledStartAt: form.scheduledStartAt ? new Date(form.scheduledStartAt).toISOString() : undefined,
    scheduledEndAt: form.scheduledEndAt ? new Date(form.scheduledEndAt).toISOString() : undefined,
    totalAmountCents: amountCents,
    currency: form.currency,
    status: 'New'
  })

  closeModal()
  await syncStore.syncNow()
}
</script>
