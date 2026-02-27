<template>
  <div class="min-h-screen">
    <header class="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-slate-500">JTrack</p>
          <h1 class="text-lg font-semibold">Field Service CRM</h1>
        </div>

        <nav class="flex items-center gap-2 text-sm">
          <NuxtLink class="rounded px-3 py-2 hover:bg-slate-100" to="/locations">Locations</NuxtLink>
          <NuxtLink class="rounded px-3 py-2 hover:bg-slate-100" to="/tickets">Tickets</NuxtLink>
          <NuxtLink class="rounded px-3 py-2 hover:bg-slate-100" to="/dispatch">Dispatch</NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <button
            class="group flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-slate-600"
            :disabled="syncStore.syncing"
            :title="syncStore.lastSyncedAt ? `Last sync: ${new Date(syncStore.lastSyncedAt).toLocaleTimeString()}` : 'Sync now'"
            @click="syncNow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition group-hover:text-emerald-600" :class="{ 'animate-spin': syncStore.syncing }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span v-if="syncStore.syncing">Syncing</span>
            <span v-else-if="syncStore.lastSyncedAt">{{ new Date(syncStore.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
          </button>
          <span v-if="syncStore.error" class="text-xs text-orange-500" :title="syncStore.error">!</span>
          <div class="h-4 w-px bg-slate-200" />
          <button class="text-xs text-slate-400 transition hover:text-slate-600" @click="logout">Sign out</button>
        </div>
      </div>

      <div v-if="locationStore.activeLocation" class="mx-auto max-w-6xl px-4 pb-2">
        <span class="text-xs text-slate-400">{{ locationStore.activeLocation.name }}</span>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { destroyDatabase } from '~/plugins/rxdb.client'

const authStore = useAuthStore()
const locationStore = useLocationStore()
const syncStore = useSyncStore()

const syncNow = async () => {
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
</script>
