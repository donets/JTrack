<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <form
      v-if="!submitted"
      class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow"
      @submit.prevent="submit"
    >
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">JTrack</p>
        <h1 class="text-2xl font-semibold">Create your account</h1>
      </div>

      <label class="block space-y-1">
        <span class="text-sm text-slate-600">Full name</span>
        <input
          v-model="form.name"
          class="w-full rounded border border-slate-300 px-3 py-2"
          type="text"
          required
          @blur="touched.name = true"
        />
        <p v-if="touched.name && !form.name" class="text-xs text-red-500">Name is required</p>
      </label>

      <label class="block space-y-1">
        <span class="text-sm text-slate-600">Email</span>
        <input
          v-model="form.email"
          class="w-full rounded border border-slate-300 px-3 py-2"
          autocomplete="email"
          type="email"
          required
          @blur="touched.email = true"
        />
        <p v-if="touched.email && !form.email" class="text-xs text-red-500">Email is required</p>
      </label>

      <label class="relative block space-y-1">
        <span class="text-sm text-slate-600">Password</span>
        <div class="relative">
          <input
            v-model="form.password"
            class="w-full rounded border border-slate-300 px-3 py-2 pr-10"
            autocomplete="new-password"
            :type="showPassword ? 'text' : 'password'"
            required
            minlength="8"
            maxlength="128"
            @blur="touched.password = true"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? '&#x1F441;' : '&#x1F441;&#xFE0F;&#x200D;&#x1F5E8;' }}
          </button>
        </div>
        <div v-if="touched.password && form.password.length > 0" class="space-y-0.5 text-xs">
          <p :class="form.password.length >= 8 ? 'text-emerald-600' : 'text-red-500'">At least 8 characters</p>
          <p :class="/[A-Z]/.test(form.password) ? 'text-emerald-600' : 'text-red-500'">At least one uppercase letter</p>
          <p :class="/[a-z]/.test(form.password) ? 'text-emerald-600' : 'text-red-500'">At least one lowercase letter</p>
          <p :class="/[0-9]/.test(form.password) ? 'text-emerald-600' : 'text-red-500'">At least one digit</p>
        </div>
      </label>

      <label class="block space-y-1">
        <span class="text-sm text-slate-600">Business / Location name</span>
        <input
          v-model="form.locationName"
          class="w-full rounded border border-slate-300 px-3 py-2"
          type="text"
          required
          @blur="touched.locationName = true"
        />
        <p v-if="touched.locationName && !form.locationName" class="text-xs text-red-500">
          Location name is required
        </p>
      </label>

      <label class="block space-y-1">
        <span class="text-sm text-slate-600">Timezone</span>
        <select
          v-model="form.timezone"
          class="w-full rounded border border-slate-300 px-3 py-2"
          required
        >
          <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
        </select>
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        class="w-full rounded bg-emerald-600 px-3 py-2 font-medium text-white disabled:opacity-60"
        :disabled="submitting"
        type="submit"
      >
        {{ submitting ? 'Creating account...' : 'Continue' }}
      </button>

      <p class="text-center text-sm text-slate-500">
        Already have an account?
        <NuxtLink to="/login" class="text-emerald-600 hover:underline">Sign in</NuxtLink>
      </p>
    </form>

    <form
      v-else-if="!verified"
      class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow"
      @submit.prevent="verifyCode"
    >
      <div class="text-center">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">JTrack</p>
        <h1 class="text-2xl font-semibold">Verify your email</h1>
        <p class="mt-1 text-sm text-slate-500">
          We sent a 6-digit code to <strong>{{ form.email }}</strong>
        </p>
      </div>

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

      <p v-if="codeError" class="text-sm text-red-600">{{ codeError }}</p>

      <button
        class="w-full rounded bg-emerald-600 px-3 py-2 font-medium text-white disabled:opacity-60"
        :disabled="verifying || code.length !== 6"
        type="submit"
      >
        {{ verifying ? 'Verifying...' : 'Verify' }}
      </button>

      <button
        type="button"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        :disabled="resendCooldown > 0"
        @click="resendVerification"
      >
        {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code' }}
      </button>

      <p class="text-center text-sm text-slate-500">
        <NuxtLink to="/login" class="text-emerald-600 hover:underline">Back to sign in</NuxtLink>
      </p>
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

const timezones = Intl.supportedValuesOf('timeZone')

const form = reactive({
  name: '',
  email: '',
  password: '',
  locationName: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
})

const touched = reactive({
  name: false,
  email: false,
  password: false,
  locationName: false
})

const showPassword = ref(false)
const error = ref<string | null>(null)
const submitting = ref(false)
const submitted = ref(false)

const code = ref('')
const codeError = ref<string | null>(null)
const verifying = ref(false)
const verified = ref(false)
const resendCooldown = ref(0)

let cooldownInterval: ReturnType<typeof setInterval> | null = null

const submit = async () => {
  error.value = null
  submitting.value = true

  try {
    await $fetch('/auth/register', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: {
        email: form.email,
        name: form.name,
        password: form.password,
        locationName: form.locationName,
        timezone: form.timezone
      }
    })

    submitted.value = true
    startCooldown()
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}

const verifyCode = async () => {
  codeError.value = null
  verifying.value = true

  try {
    await $fetch('/auth/verify-email/confirm', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { email: form.email, code: code.value }
    })

    verified.value = true

    setTimeout(() => {
      navigateTo('/login?toast=Email+verified.+Sign+in+to+continue.')
    }, 2000)
  } catch (err: any) {
    codeError.value = err?.data?.message ?? 'Invalid or expired code. Please try again.'
  } finally {
    verifying.value = false
  }
}

const resendVerification = async () => {
  try {
    await $fetch('/auth/verify-email/request', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { email: form.email }
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
