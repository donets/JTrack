<template>
  <section class="space-y-6">
    <JPageHeader
      title="Locations"
      description="Select active location for tenant-scoped operations."
      :breadcrumbs="breadcrumbs"
    />

    <div class="grid gap-3 md:grid-cols-2">
      <article
        v-for="location in locationStore.memberships"
        :key="location.id"
        class="rounded-xl border border-slate-200 bg-white p-4"
      >
        <h3 class="font-semibold">{{ location.name }}</h3>
        <p class="text-sm text-slate-600">{{ location.timezone }}</p>
        <p class="text-sm text-slate-500">Role: {{ location.role }}</p>
        <button
          class="mt-3 rounded px-3 py-2 text-sm"
          :class="
            locationStore.activeLocationId === location.id
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700'
          "
          @click="selectLocation(location.id)"
        >
          {{ locationStore.activeLocationId === location.id ? 'Active' : 'Use this location' }}
        </button>
      </article>
    </div>

    <form class="rounded-xl border border-slate-200 bg-white p-4" @submit.prevent="createLocation">
      <h3 class="mb-3 font-semibold">Create location</h3>
      <div class="grid gap-3 md:grid-cols-3">
        <input
          v-model="newLocation.name"
          class="rounded border border-slate-300 px-3 py-2"
          placeholder="Name"
          required
        />
        <input
          v-model="newLocation.timezone"
          class="rounded border border-slate-300 px-3 py-2"
          placeholder="Timezone"
          required
        />
        <input
          v-model="newLocation.address"
          class="rounded border border-slate-300 px-3 py-2"
          placeholder="Address"
        />
      </div>
      <button class="mt-3 rounded bg-ink px-3 py-2 text-sm text-white" type="submit">
        Create
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/ui'

const api = useApiClient()
const locationStore = useLocationStore()
const { setBreadcrumbs } = useBreadcrumbs()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Locations', to: '/locations' }
]

setBreadcrumbs(breadcrumbs)

const newLocation = reactive({
  name: '',
  timezone: 'Europe/Berlin',
  address: ''
})

const selectLocation = async (locationId: string) => {
  locationStore.setActiveLocation(locationId)
  await navigateTo('/tickets')
}

const createLocation = async () => {
  await api.post('/locations', {
    name: newLocation.name,
    timezone: newLocation.timezone,
    address: newLocation.address
  })

  newLocation.name = ''
  newLocation.address = ''
  await locationStore.loadLocations()
}
</script>
