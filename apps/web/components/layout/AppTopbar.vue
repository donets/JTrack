<template>
  <header class="border-b border-mist-dark bg-white">
    <div class="flex h-topbar items-center gap-3 px-3 md:px-5">
      <button
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-mist hover:text-ink md:hidden"
        aria-label="Open menu"
        @click="openMobileDrawer"
      >
        ☰
      </button>

      <nav v-if="breadcrumbs.length > 0" class="flex min-w-0 items-center truncate text-lg text-slate-500">
        <template v-for="(item, index) in breadcrumbs" :key="`${item.label}-${index}`">
          <span v-if="index > 0" class="px-2 text-slate-300">/</span>
          <NuxtLink
            v-if="item.to && index < breadcrumbs.length - 1"
            :to="item.to"
            class="rounded px-1.5 py-0.5 hover:bg-slate-100 hover:text-slate-800"
          >
            {{ item.label }}
          </NuxtLink>
          <span v-else class="px-1.5 py-0.5 font-semibold text-slate-800">{{ item.label }}</span>
        </template>
      </nav>
      <span v-else class="min-w-0 truncate text-lg font-semibold text-ink">{{ pageTitle }}</span>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="hidden rounded-md border border-mist-dark px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-mist sm:inline-flex"
          :disabled="syncStore.syncing"
          @click="syncNow"
        >
          {{ syncStore.syncing ? 'Syncing...' : 'Sync now' }}
        </button>

        <div class="hidden items-center gap-2 sm:flex">
          <span class="h-2.5 w-2.5 rounded-full" :class="syncDotClass" />
          <span class="text-xs text-slate-500">{{ syncLabel }}</span>
        </div>

        <div ref="locationRef" class="relative">
          <button
            type="button"
            class="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-ink"
            @click="locationOpen = !locationOpen"
          >
            <span class="max-w-[160px] truncate">{{ activeLocationName }}</span>
            <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </button>
          <ul
            v-if="locationOpen"
            class="absolute right-0 z-40 mt-2 min-w-[180px] rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            <li
              v-for="loc in locationStore.memberships"
              :key="loc.id"
              class="cursor-pointer px-3 py-2 text-sm hover:bg-slate-50"
              :class="loc.id === locationStore.activeLocationId ? 'font-medium text-ink' : 'text-slate-600'"
              @click="switchLocation(loc.id); locationOpen = false"
            >
              {{ loc.name }}
            </li>
          </ul>
        </div>

        <JDropdown :items="userMenuItems" align="right">
          <template #trigger>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-md p-1 hover:bg-mist"
              aria-label="Open account menu"
            >
              <JAvatar size="md" :name="userName" />
              <span class="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 lg:inline">{{ userName }}</span>
            </button>
          </template>
        </JDropdown>
      </div>
    </div>

    <div v-if="$slots.tabs" class="border-t border-mist-dark px-3 md:px-5">
      <slot name="tabs" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { DropdownItem } from '~/types/ui'
import { destroyDatabase } from '~/plugins/rxdb.client'

const route = useRoute()
const authStore = useAuthStore()
const locationStore = useLocationStore()
const syncStore = useSyncStore()
const { breadcrumbs, title } = useBreadcrumbs()
const { openMobileDrawer } = useLayoutState()

const isOnline = ref(true)
const now = ref(Date.now())
let syncAgeTimer: ReturnType<typeof setInterval> | null = null

const formatRouteTitle = (path: string) => {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) {
    return 'Dashboard'
  }

  const last = parts[parts.length - 1] ?? ''
  if (!last) {
    return 'Dashboard'
  }

  return last
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const userName = computed(() => authStore.user?.name ?? 'User')
const activeLocationName = computed(() => locationStore.activeLocation?.name ?? 'Select location')

const locationOpen = ref(false)
const locationRef = ref<HTMLElement | null>(null)

const onClickOutsideLocation = (e: MouseEvent) => {
  if (locationOpen.value && locationRef.value && !locationRef.value.contains(e.target as Node)) {
    locationOpen.value = false
  }
}

const pageTitle = computed(() => title.value || formatRouteTitle(route.path))

const syncAgeMs = computed(() => {
  if (!syncStore.lastSyncedAt) {
    return null
  }

  return Math.max(0, now.value - syncStore.lastSyncedAt)
})

const syncDotClass = computed(() => {
  if (!isOnline.value) {
    return 'bg-flame'
  }

  if (syncStore.error) {
    return 'bg-rose'
  }

  if (syncStore.syncing) {
    return 'animate-pulse bg-flame'
  }

  if (syncAgeMs.value === null) {
    return 'bg-slate-400'
  }

  return syncAgeMs.value < 60_000 ? 'bg-mint' : 'bg-flame'
})

const syncLabel = computed(() => {
  if (!isOnline.value) {
    return 'Offline'
  }

  if (syncStore.error) {
    return syncStore.error
  }

  if (syncStore.syncing) {
    return 'Sync in progress'
  }

  if (!syncStore.lastSyncedAt) {
    return 'Never synced'
  }

  return `Last sync ${new Date(syncStore.lastSyncedAt).toLocaleTimeString()}`
})

const syncNow = async () => {
  await syncStore.syncNow()
}

const switchLocation = async (locationId: string) => {
  if (!locationId || locationStore.activeLocationId === locationId) return
  locationStore.setActiveLocation(locationId)
  await syncStore.syncNow()
}

const logout = async () => {
  try {
    await authStore.logout()
  } finally {
    locationStore.clear()
    syncStore.clearSyncData()
  }

  try {
    await destroyDatabase()
  } catch (error) {
    console.warn('[auth] failed to destroy local database during logout', error)
  }

  await navigateTo('/login')
}


const userMenuItems = computed<DropdownItem[]>(() => [
  {
    label: 'Profile',
    icon: '👤',
    action: async () => {
      await navigateTo('/settings')
    }
  },
  {
    label: 'Locations',
    icon: '📍',
    action: async () => {
      await navigateTo('/locations')
    }
  },
  {
    label: 'Logout',
    icon: '↩',
    variant: 'danger',
    action: logout
  }
])

const setOnlineStatus = () => {
  isOnline.value = import.meta.client ? navigator.onLine : true
}

onMounted(() => {
  setOnlineStatus()
  if (import.meta.client) {
    syncAgeTimer = setInterval(() => {
      now.value = Date.now()
    }, 15_000)
    window.addEventListener('online', setOnlineStatus)
    window.addEventListener('offline', setOnlineStatus)
    document.addEventListener('mousedown', onClickOutsideLocation)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    if (syncAgeTimer) {
      clearInterval(syncAgeTimer)
      syncAgeTimer = null
    }
    window.removeEventListener('online', setOnlineStatus)
    window.removeEventListener('offline', setOnlineStatus)
    document.removeEventListener('mousedown', onClickOutsideLocation)
  }
})
</script>
