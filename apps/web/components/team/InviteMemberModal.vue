<template>
  <JModal v-model="isOpen" title="Invite Team Member" size="md">
    <form class="space-y-4" @submit.prevent="submitInvite">
      <JInput
        v-model="form.email"
        label="Email address"
        type="email"
        placeholder="colleague@email.com"
        required
        :error="errors.email"
      />

      <JInput
        v-model="form.name"
        label="Full name"
        placeholder="John Doe"
        required
        :error="errors.name"
      />

      <fieldset>
        <legend class="text-sm font-semibold text-ink">Role</legend>
        <p class="mt-1 text-xs text-slate-500">Choose permission level for this location.</p>

        <div class="mt-2 grid gap-2 sm:grid-cols-3">
          <button
            v-for="option in roleOptions"
            :key="option.role"
            type="button"
            :class="roleCardClasses(option.role)"
            @click="selectRole(option.role)"
          >
            <span class="text-sm font-semibold">{{ option.role }}</span>
            <span class="mt-1 text-[11px] text-slate-500">{{ option.description }}</span>
          </button>
        </div>

        <p v-if="errors.role" class="mt-2 text-xs text-rose-600">{{ errors.role }}</p>
      </fieldset>

      <div class="rounded-md bg-mist px-3 py-2 text-xs text-ink-light">
        Invitation email includes a link for password setup and onboarding to the active location.
      </div>
    </form>

    <template #footer>
      <JButton variant="secondary" :disabled="submitting" @click="closeModal">Cancel</JButton>
      <JButton variant="primary" :loading="submitting" @click="submitInvite">Send Invite</JButton>
    </template>
  </JModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { RoleKey } from '@jtrack/shared'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  invited: []
}>()

const teamStore = useTeamStore()
const { show } = useToast()

const submitting = ref(false)
const form = reactive({
  email: '',
  name: '',
  role: 'Technician' as RoleKey
})

const errors = reactive({
  email: '',
  name: '',
  role: ''
})

const roleOptions: { role: RoleKey; description: string }[] = [
  { role: 'Owner', description: 'Full access including billing and settings.' },
  { role: 'Manager', description: 'Operations access without owner controls.' },
  { role: 'Technician', description: 'Field execution and ticket progress updates.' }
]

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const clearErrors = () => {
  errors.email = ''
  errors.name = ''
  errors.role = ''
}

const resetForm = () => {
  form.email = ''
  form.name = ''
  form.role = 'Technician'
  clearErrors()
}

const closeModal = () => {
  isOpen.value = false
  resetForm()
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const validateForm = () => {
  clearErrors()

  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(form.email.trim())) {
    errors.email = 'Enter a valid email address'
  }

  if (!form.name.trim()) {
    errors.name = 'Name is required'
  }

  if (!form.role) {
    errors.role = 'Role is required'
  }

  return !errors.email && !errors.name && !errors.role
}

const selectRole = (role: RoleKey) => {
  form.role = role
  errors.role = ''
}

const roleCardClasses = (role: RoleKey) => [
  'flex flex-col rounded-md border px-3 py-3 text-left transition-colors',
  form.role === role
    ? 'border-mint bg-mint-light/40'
    : 'border-slate-200 bg-white hover:border-slate-300'
]

const submitInvite = async () => {
  if (submitting.value) {
    return
  }

  if (!validateForm()) {
    return
  }

  submitting.value = true

  try {
    await teamStore.inviteMember({
      email: form.email.trim().toLowerCase(),
      name: form.name.trim(),
      role: form.role
    })

    show({
      type: 'success',
      message: `Invitation sent to ${form.email.trim().toLowerCase()}`
    })
    emit('invited')
    closeModal()
  } catch {
    show({
      type: 'error',
      message: teamStore.error ?? 'Failed to send invitation'
    })
  } finally {
    submitting.value = false
  }
}
</script>
