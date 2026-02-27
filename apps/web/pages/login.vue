<template>
  <div class="w-full max-w-sm">
    <form class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow" @submit.prevent="submit">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">JTrack</p>
        <h1 class="text-2xl font-semibold">Sign in</h1>
      </div>

      <div v-if="toast" class="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {{ toast }}
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

      <label class="relative block space-y-1">
        <span class="text-sm text-slate-600">Password</span>
        <div class="relative">
          <input
            v-model="password"
            class="w-full rounded border border-slate-300 px-3 py-2 pr-10"
            autocomplete="current-password"
            :type="showPassword ? 'text' : 'password'"
            required
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? '&#x1F441;' : '&#x1F441;&#xFE0F;&#x200D;&#x1F5E8;' }}
          </button>
        </div>
      </label>

      <div class="text-right">
        <NuxtLink to="/forgot-password" class="text-sm text-emerald-600 hover:underline">
          Forgot password?
        </NuxtLink>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        class="w-full rounded bg-emerald-600 px-3 py-2 font-medium text-white disabled:opacity-60"
        :disabled="submitting"
        type="submit"
      >
        {{ submitting ? 'Signing in...' : 'Sign in' }}
      </button>

      <p class="text-center text-sm text-slate-500">
        Don't have an account?
        <NuxtLink to="/signup" class="text-emerald-600 hover:underline">Create account</NuxtLink>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const locationStore = useLocationStore()
const route = useRoute()

const email = ref('owner@demo.local')
const password = ref('password123')
const showPassword = ref(false)
const error = ref<string | null>(null)
const submitting = ref(false)
const toast = ref<string | null>(null)

onMounted(() => {
  const toastParam = route.query.toast as string
  if (toastParam) {
    toast.value = toastParam
  }
})

const submit = async () => {
  error.value = null
  toast.value = null
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
