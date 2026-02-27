<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <form class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow" @submit.prevent="submit">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">JTrack</p>
        <h1 class="text-2xl font-semibold">Sign in</h1>
      </div>

      <label class="block space-y-1">
        <span class="text-sm text-slate-600">Email</span>
        <input
          v-model="email"
          class="w-full rounded border border-slate-300 px-3 py-2"
          autocomplete="email"
          type="email"
          required
        />
      </label>

      <label class="block space-y-1">
        <span class="text-sm text-slate-600">Password</span>
        <input
          v-model="password"
          class="w-full rounded border border-slate-300 px-3 py-2"
          autocomplete="current-password"
          type="password"
          required
        />
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        class="w-full rounded bg-emerald-600 px-3 py-2 font-medium text-white disabled:opacity-60"
        :disabled="submitting"
        type="submit"
      >
        {{ submitting ? 'Signing in...' : 'Sign in' }}
      </button>

      <p class="text-xs text-slate-500">Demo owner: owner@demo.local / password123</p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const locationStore = useLocationStore()

const email = ref('owner@demo.local')
const password = ref('password123')
const error = ref<string | null>(null)
const submitting = ref(false)

const submit = async () => {
  error.value = null
  submitting.value = true

  try {
    await authStore.login(email.value, password.value)
    await locationStore.loadLocations()
    await navigateTo('/dashboard')
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Unable to sign in'
  } finally {
    submitting.value = false
  }
}
</script>
