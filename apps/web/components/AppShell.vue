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

        <div class="flex items-center gap-2">
          <button
            class="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            :disabled="syncStore.syncing"
            @click="syncNow"
          >
            {{ syncStore.syncing ? 'Syncing...' : 'Sync now' }}
          </button>
          <button class="rounded border border-slate-300 px-3 py-2 text-sm" @click="logout">Logout</button>
        </div>
      </div>

      <div class="mx-auto max-w-6xl px-4 pb-3 text-xs text-slate-500">
        <span v-if="locationStore.activeLocation">
          Location: {{ locationStore.activeLocation.name }}
        </span>
        <span v-if="syncStore.lastSyncedAt" class="ml-3">
          Last sync: {{ new Date(syncStore.lastSyncedAt).toLocaleTimeString() }}
        </span>
        <span v-if="syncStore.error" class="ml-3 text-orange-600">
          {{ syncStore.error }}
        </span>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const locationStore = useLocationStore()
const syncStore = useSyncStore()

const syncNow = async () => {
  await syncStore.syncNow()
}

const logout = async () => {
  await authStore.logout()
  locationStore.clear()
  await navigateTo('/login')
}
</script>
