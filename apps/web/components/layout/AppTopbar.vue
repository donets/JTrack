<template>
  <header class="border-b border-mist-dark bg-white">
    <div class="flex h-topbar items-stretch">
      <div class="flex min-w-0 flex-1 items-center gap-2 px-3 sm:gap-3 md:px-5">
        <button
          type="button"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-mist hover:text-ink md:hidden"
          aria-label="Open menu"
          @click="openMobileDrawer"
        >
          ☰
        </button>

        <nav v-if="breadcrumbs.length > 0" class="flex min-w-0 items-center truncate text-sm text-slate-500 sm:text-lg">
          <template v-for="(item, index) in breadcrumbs" :key="`${item.label}-${index}`">
            <span v-if="index > 0" class="px-1.5 text-slate-300 sm:px-2">/</span>
            <NuxtLink
              v-if="item.to && index < breadcrumbs.length - 1"
              :to="item.to"
              class="rounded px-1 py-0.5 hover:bg-slate-100 hover:text-slate-800 sm:px-1.5"
            >
              {{ item.label }}
            </NuxtLink>
            <span v-else class="truncate px-1 py-0.5 font-semibold text-slate-800 sm:px-1.5">{{ item.label }}</span>
          </template>
        </nav>
        <span v-else class="min-w-0 truncate text-sm font-semibold text-ink sm:text-lg">{{ pageTitle }}</span>

        <button
          type="button"
          class="ml-auto hidden w-[105px] shrink-0 items-center justify-center gap-1.5 rounded-md border border-mist-dark py-1.5 text-sm font-semibold text-slate-600 hover:bg-mist sm:inline-flex"
          :disabled="syncStore.syncing"
          @click="syncNow"
        >
          <span class="h-2 w-2 shrink-0 rounded-full" :class="syncDotClass" />
          {{ syncStore.syncing ? 'Syncing...' : syncStore.lastSyncedAt ? 'Synced' : 'Sync now' }}
        </button>
      </div>

      <div
        ref="locationRef"
        class="relative hidden w-[180px] shrink-0 items-center justify-center border-l border-r border-slate-200 sm:flex"
        :class="hasMultipleLocations ? 'cursor-pointer hover:bg-slate-50' : ''"
        @click="hasMultipleLocations && (locationOpen = !locationOpen)"
      >
        <span class="inline-flex items-center gap-1 text-sm text-slate-700">
          <span class="max-w-[140px] truncate">{{ activeLocationName }}</span>
          <svg v-if="hasMultipleLocations" class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </span>
        <ul
          v-if="locationOpen"
          class="absolute -left-px -right-px top-full z-40 border border-t-0 border-slate-200 bg-white py-1 shadow-lg"
        >
          <li
            v-for="loc in locationStore.memberships"
            :key="loc.id"
            class="cursor-pointer px-4 py-2 text-sm hover:bg-slate-50"
            :class="loc.id === locationStore.activeLocationId ? 'font-medium text-ink' : 'text-slate-600'"
            @click="switchLocation(loc.id); locationOpen = false"
          >
            {{ loc.name }}
          </li>
        </ul>
      </div>

      <div
        ref="userRef"
        class="relative flex shrink-0 cursor-pointer items-center gap-2 pl-3 pr-3 hover:bg-slate-50 sm:pl-4 sm:pr-5"
        @click="userOpen = !userOpen"
      >
        <JAvatar size="md" :name="userName" />
        <span class="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 lg:inline">{{ userName }}</span>
        <svg class="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
        <ul
          v-if="userOpen"
          class="absolute right-0 top-full z-40 min-w-[160px] border border-t-0 border-slate-200 bg-white py-1 shadow-lg"
        >
          <li
            class="cursor-pointer px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            @click="userOpen = false; navigateTo('/settings')"
          >
            Profile
          </li>
          <li
            class="cursor-pointer px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            @click="userOpen = false; navigateTo('/locations')"
          >
            Locations
          </li>
          <li
            class="cursor-pointer px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
            @click="userOpen = false; logout()"
          >
            Logout
          </li>
        </ul>
      </div>
    </div>

    <div v-if="$slots.tabs" class="border-t border-mist-dark px-3 md:px-5">
      <slot name="tabs" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
const hasMultipleLocations = computed(() => locationStore.memberships.length > 1)

const locationOpen = ref(false)
const locationRef = ref<HTMLElement | null>(null)
const userOpen = ref(false)
const userRef = ref<HTMLElement | null>(null)

const onClickOutsideDropdowns = (e: MouseEvent) => {
  const target = e.target as Node
  if (locationOpen.value && locationRef.value && !locationRef.value.contains(target)) {
    locationOpen.value = false
  }
  if (userOpen.value && userRef.value && !userRef.value.contains(target)) {
    userOpen.value = false
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


const syncNow = async () => {
  await syncStore.syncNow()
}

const switchLocation = async (locationId: string) => {
  if (!locationId || locationStore.activeLocationId === locationId) return
  locationStore.setActiveLocation(locationId)
  await syncStore.syncNow()

  // If on a detail page, redirect to dashboard since the item may not exist in the new location
  const path = route.path
  if (route.params.id || /\/[0-9a-f-]{36}/.test(path)) {
    await navigateTo('/dashboard')
  }
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
    document.addEventListener('mousedown', onClickOutsideDropdowns)
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
    document.removeEventListener('mousedown', onClickOutsideDropdowns)
  }
})
</script>
