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

      <div class="min-w-0">
        <p v-if="breadcrumbs.length > 0" class="truncate text-xs text-slate-500">
          <span v-for="(item, index) in breadcrumbs" :key="`${item.label}-${index}`">
            <span v-if="index > 0" class="px-1">/</span>
            {{ item.label }}
          </span>
        </p>
        <h1 class="truncate text-sm font-semibold text-ink md:text-base">{{ pageTitle }}</h1>
      </div>

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

        <JDropdown :items="locationItems" align="right">
          <template #trigger>
            <button
              type="button"
              class="inline-flex max-w-[160px] items-center gap-1 rounded-md border border-mist-dark px-2 py-1 text-xs text-slate-600 hover:bg-mist md:max-w-[220px]"
              aria-label="Switch location"
            >
              <span>📍</span>
              <span class="truncate">{{ activeLocationName }}</span>
              <span>▾</span>
            </button>
          </template>
        </JDropdown>

        <button
          type="button"
          class="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-mist hover:text-ink"
          aria-label="Notifications"
        >
          🔔
          <span class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose" />
        </button>

        <JDropdown :items="userMenuItems" align="right">
          <template #trigger>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-md p-1 hover:bg-mist"
              aria-label="Open account menu"
            >
              <JAvatar size="sm" :name="userName" />
              <span class="hidden max-w-[120px] truncate text-xs text-slate-600 lg:inline">{{ userName }}</span>
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
  if (locationStore.activeLocationId === locationId) {
    return
  }

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

const locationItems = computed<DropdownItem[]>(() =>
  locationStore.memberships.map((membership) => ({
    label: membership.name,
    icon: membership.id === locationStore.activeLocationId ? '✓' : '📍',
    action: () => switchLocation(membership.id)
  }))
)

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
  }
})
</script>
