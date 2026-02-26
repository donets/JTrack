<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <form
      v-if="!verified"
      class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow"
      @submit.prevent="submit"
    >
      <div class="text-center">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">JTrack</p>
        <h1 class="text-2xl font-semibold">Verify your email</h1>
        <p class="mt-1 text-sm text-slate-500">Enter your email and the 6-digit code we sent you.</p>
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
        <span class="text-sm text-slate-600">Verification code</span>
        <input
          v-model="code"
          class="w-full rounded border border-slate-300 px-3 py-2 text-center text-2xl tracking-[0.3em] font-mono"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          placeholder="000000"
          required
        />
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        class="w-full rounded bg-emerald-600 px-3 py-2 font-medium text-white disabled:opacity-60"
        :disabled="submitting || code.length !== 6"
        type="submit"
      >
        {{ submitting ? 'Verifying...' : 'Verify' }}
      </button>

      <div class="space-y-1 text-center text-sm text-slate-500">
        <button
          type="button"
          class="text-emerald-600 hover:underline disabled:opacity-60 disabled:no-underline"
          :disabled="resendCooldown > 0"
          @click="resendCode"
        >
          {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code' }}
        </button>
        <p>
          <NuxtLink to="/login" class="text-emerald-600 hover:underline">Back to sign in</NuxtLink>
        </p>
      </div>
    </form>

    <div v-else class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow text-center">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">JTrack</p>
      <h1 class="text-2xl font-semibold">Email verified</h1>
      <p class="text-slate-600">Redirecting to sign in...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()

const email = ref((route.query.email as string) ?? '')
const code = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)
const verified = ref(false)
const resendCooldown = ref(0)

let cooldownInterval: ReturnType<typeof setInterval> | null = null

const submit = async () => {
  error.value = null
  submitting.value = true

  try {
    await $fetch('/auth/verify-email/confirm', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { email: email.value, code: code.value }
    })

    verified.value = true

    setTimeout(() => {
      navigateTo('/login?toast=Email+verified.+Sign+in+to+continue.')
    }, 2000)
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Invalid or expired code. Please try again.'
  } finally {
    submitting.value = false
  }
}

const resendCode = async () => {
  if (!email.value) {
    error.value = 'Enter your email first.'
    return
  }

  try {
    await $fetch('/auth/verify-email/request', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { email: email.value }
    })
    startCooldown()
  } catch {
    // Silent fail — anti-enumeration
  }
}

const startCooldown = () => {
  resendCooldown.value = 60
  if (cooldownInterval) clearInterval(cooldownInterval)
  cooldownInterval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval)
      cooldownInterval = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})
</script>
