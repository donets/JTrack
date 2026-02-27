<template>
  <div class="w-full max-w-sm">
    <form
      v-if="!success"
      class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow"
      @submit.prevent="submit"
    >
      <div class="text-center">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">JTrack</p>
        <h1 class="text-2xl font-semibold">Set a new password</h1>
        <p class="mt-1 text-sm text-slate-500">Enter the 6-digit code from your email and a new password.</p>
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
        <span class="text-sm text-slate-600">Reset code</span>
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

      <label class="relative block space-y-1">
        <span class="text-sm text-slate-600">New password</span>
        <div class="relative">
          <input
            v-model="newPassword"
            class="w-full rounded border border-slate-300 px-3 py-2 pr-10"
            autocomplete="new-password"
            :type="showPassword ? 'text' : 'password'"
            required
            minlength="8"
            maxlength="128"
            @blur="touched = true"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? '&#x1F441;' : '&#x1F441;&#xFE0F;&#x200D;&#x1F5E8;' }}
          </button>
        </div>
        <div v-if="touched && newPassword.length > 0" class="space-y-0.5 text-xs">
          <p :class="newPassword.length >= 8 ? 'text-emerald-600' : 'text-red-500'">At least 8 characters</p>
          <p :class="/[A-Z]/.test(newPassword) ? 'text-emerald-600' : 'text-red-500'">At least one uppercase letter</p>
          <p :class="/[a-z]/.test(newPassword) ? 'text-emerald-600' : 'text-red-500'">At least one lowercase letter</p>
          <p :class="/[0-9]/.test(newPassword) ? 'text-emerald-600' : 'text-red-500'">At least one digit</p>
        </div>
      </label>

      <label class="block space-y-1">
        <span class="text-sm text-slate-600">Confirm password</span>
        <input
          v-model="confirmPassword"
          class="w-full rounded border border-slate-300 px-3 py-2"
          autocomplete="new-password"
          :type="showPassword ? 'text' : 'password'"
          required
          @blur="touchedConfirm = true"
        />
        <p v-if="touchedConfirm && confirmPassword && confirmPassword !== newPassword" class="text-xs text-red-500">
          Passwords do not match
        </p>
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        class="w-full rounded bg-emerald-600 px-3 py-2 font-medium text-white disabled:opacity-60"
        :disabled="submitting || code.length !== 6 || !isPasswordValid || newPassword !== confirmPassword"
        type="submit"
      >
        {{ submitting ? 'Resetting...' : 'Reset password' }}
      </button>

      <p class="text-center text-sm text-slate-500">
        <NuxtLink to="/login" class="text-emerald-600 hover:underline">Back to sign in</NuxtLink>
      </p>
    </form>

    <div v-else class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow text-center">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">JTrack</p>
      <h1 class="text-2xl font-semibold">Password updated</h1>
      <p class="text-slate-600">Redirecting to sign in...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const config = useRuntimeConfig()
const route = useRoute()

const email = ref((route.query.email as string) ?? '')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const touched = ref(false)
const touchedConfirm = ref(false)
const error = ref<string | null>(null)
const submitting = ref(false)
const success = ref(false)

const isPasswordValid = computed(() =>
  newPassword.value.length >= 8 &&
  /[A-Z]/.test(newPassword.value) &&
  /[a-z]/.test(newPassword.value) &&
  /[0-9]/.test(newPassword.value)
)

const submit = async () => {
  error.value = null
  submitting.value = true

  try {
    await $fetch('/auth/password/reset', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: {
        email: email.value,
        code: code.value,
        newPassword: newPassword.value
      }
    })

    success.value = true

    setTimeout(() => {
      navigateTo('/login?toast=Password+updated.+Sign+in+with+your+new+password.')
    }, 2000)
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Invalid or expired code. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
