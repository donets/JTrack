<template>
  <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
    <article class="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div ref="mapElement" class="h-[520px] w-full" />
    </article>

    <aside class="rounded-xl border border-slate-200 bg-white">
      <header class="flex items-center justify-between border-b border-slate-200 px-3 py-3">
        <h3 class="text-sm font-semibold text-ink">Today's Jobs</h3>
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {{ todayPoints.length }}
        </span>
      </header>

      <div class="max-h-[520px] space-y-2 overflow-y-auto p-3">
        <button
          v-for="point in todayPoints"
          :key="point.ticket.id"
          type="button"
          class="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left transition-colors hover:bg-slate-50"
          @click="focusTicket(point.ticket.id)"
        >
          <p class="truncate text-xs font-semibold text-ink">{{ point.ticket.title }}</p>
          <p class="mt-0.5 text-[11px] text-slate-500">
            {{ point.technicianLabel }} · {{ timeLabel(point.ticket.scheduledStartAt) }}
          </p>
        </button>

        <p
          v-if="todayPoints.length === 0"
          class="rounded-md border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-500"
        >
          No scheduled jobs for selected day
        </p>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import type { DispatchMapTicket } from '~/types/ui'

type MapPoint = {
  ticket: DispatchMapTicket
  lat: number
  lng: number
  technicianLabel: string
}

const props = defineProps<{
  tickets: DispatchMapTicket[]
  selectedDate: string
  locationId: string
  technicianNames: Record<string, string>
}>()

const emit = defineEmits<{
  'open-ticket': [ticketId: string]
  'quick-assign': [ticketId: string]
}>()

const mapElement = ref<HTMLDivElement | null>(null)
const map = ref<any | null>(null)
const markersLayer = ref<any | null>(null)
const markersByTicket = new Map<string, any>()

const mapPoints = computed<MapPoint[]>(() =>
  props.tickets.map((ticket) => {
    const coordinates = deterministicCoordinates(ticket.id, props.locationId)
    const technicianLabel = ticket.assignedToUserId
      ? (props.technicianNames[ticket.assignedToUserId] ?? 'Assigned')
      : 'Unassigned'

    return {
      ticket,
      lat: coordinates.lat,
      lng: coordinates.lng,
      technicianLabel
    }
  })
)

const todayPoints = computed(() =>
  mapPoints.value.filter((point) =>
    point.ticket.scheduledStartAt
    && isoDateUtc(point.ticket.scheduledStartAt) === props.selectedDate
  )
)

const initializeMap = () => {
  if (!mapElement.value || map.value) {
    return
  }

  const instance = L.map(mapElement.value, {
    zoomControl: true
  }).setView([37.76, -122.44], 11)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(instance)

  map.value = instance
  markersLayer.value = L.layerGroup().addTo(instance)
}

const renderMarkers = () => {
  if (!map.value || !markersLayer.value) {
    return
  }

  markersLayer.value.clearLayers()
  markersByTicket.clear()

  const bounds = L.latLngBounds([])

  for (const point of mapPoints.value) {
    const color = markerColor(point.ticket.assignedToUserId)
    const marker = L.circleMarker([point.lat, point.lng], {
      radius: point.ticket.assignedToUserId ? 8 : 9,
      color,
      fillColor: color,
      fillOpacity: point.ticket.assignedToUserId ? 0.9 : 0.35,
      weight: point.ticket.assignedToUserId ? 2 : 3,
      dashArray: point.ticket.assignedToUserId ? undefined : '2 3'
    })

    marker.bindPopup(buildPopup(point))
    marker.addTo(markersLayer.value)
    markersByTicket.set(point.ticket.id, marker)
    bounds.extend([point.lat, point.lng])
  }

  if (bounds.isValid()) {
    map.value.fitBounds(bounds.pad(0.2))
  } else {
    map.value.setView([37.76, -122.44], 11)
  }
}

const focusTicket = (ticketId: string) => {
  const marker = markersByTicket.get(ticketId)
  if (!marker || !map.value) {
    return
  }

  map.value.setView(marker.getLatLng(), Math.max(map.value.getZoom(), 13), {
    animate: true
  })
  marker.openPopup()
}

const buildPopup = (point: MapPoint) => {
  const container = document.createElement('div')
  container.className = 'space-y-2 text-xs'

  const title = document.createElement('p')
  title.className = 'font-semibold text-slate-800'
  title.textContent = point.ticket.title

  const meta = document.createElement('p')
  meta.className = 'text-slate-500'
  meta.textContent = `${point.technicianLabel} · ${timeLabel(point.ticket.scheduledStartAt)}`

  const actions = document.createElement('div')
  actions.className = 'flex items-center gap-1'

  const viewButton = document.createElement('button')
  viewButton.type = 'button'
  viewButton.className = 'rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700'
  viewButton.textContent = 'View'
  viewButton.addEventListener('click', (event) => {
    event.preventDefault()
    emit('open-ticket', point.ticket.id)
  })

  actions.appendChild(viewButton)

  if (!point.ticket.assignedToUserId) {
    const assignButton = document.createElement('button')
    assignButton.type = 'button'
    assignButton.className = 'rounded bg-sky-light px-2 py-1 text-[11px] font-semibold text-sky'
    assignButton.textContent = 'Assign'
    assignButton.addEventListener('click', (event) => {
      event.preventDefault()
      emit('quick-assign', point.ticket.id)
    })
    actions.appendChild(assignButton)
  }

  container.appendChild(title)
  container.appendChild(meta)
  container.appendChild(actions)
  return container
}

onMounted(() => {
  initializeMap()
  renderMarkers()
})

watch(mapPoints, () => {
  renderMarkers()
})

onUnmounted(() => {
  markersByTicket.clear()
  markersLayer.value?.clearLayers()
  map.value?.remove()
  map.value = null
  markersLayer.value = null
})

function deterministicCoordinates(ticketId: string, locationId: string) {
  const key = `${ticketId}-${locationId}`
  const hashLat = hashString(`${key}-lat`)
  const hashLng = hashString(`${key}-lng`)

  const minLat = 37.7
  const maxLat = 37.83
  const minLng = -122.52
  const maxLng = -122.35

  const lat = minLat + normalizeHash(hashLat) * (maxLat - minLat)
  const lng = minLng + normalizeHash(hashLng) * (maxLng - minLng)

  return { lat, lng }
}

function markerColor(assignedToUserId: string | null) {
  if (!assignedToUserId) {
    return '#64748b'
  }

  const palette = ['#0ea5e9', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#f59e0b']
  return palette[hashString(assignedToUserId) % palette.length] ?? '#0ea5e9'
}

function timeLabel(iso: string | null) {
  if (!iso) {
    return 'Not scheduled'
  }

  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) {
    return 'Not scheduled'
  }

  return value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function hashString(input: string) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function normalizeHash(value: number) {
  return (value % 10000) / 10000
}

function isoDateUtc(iso: string) {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const year = parsed.getUTCFullYear()
  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>
