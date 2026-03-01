<template>
  <JModal :model-value="modelValue" title="Quick Assign" size="md" @update:model-value="onToggle">
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <JListbox
          v-model="form.technicianId"
          label="Technician"
          placeholder="Select technician"
          :options="technicianOptions"
        >
          <template #selected="{ option }">
            <div class="inline-flex w-full items-center gap-2">
              <JAvatar :name="option.avatarName" size="sm" />
              <span class="truncate text-sm font-medium text-ink">{{ option.label }}</span>
              <span class="ml-auto shrink-0 text-xs text-slate-500">
                {{ formatJobCount(option.jobCount ?? 0) }}
              </span>
            </div>
          </template>

          <template #option="{ option }">
            <div class="inline-flex w-full items-center gap-2">
              <JAvatar :name="option.avatarName" size="sm" />
              <span class="truncate text-sm font-medium text-ink">{{ option.label }}</span>
              <span class="ml-auto shrink-0 text-xs text-slate-500">
                {{ formatJobCount(option.jobCount ?? 0) }}
              </span>
            </div>
          </template>
        </JListbox>
        <p v-if="errors.technicianId" class="mt-1 text-xs text-rose">
          {{ errors.technicianId }}
        </p>
      </div>

      <div>
        <label class="mb-1 block text-xs font-semibold text-slate-600" for="quick-assign-start-at">
          Start time
        </label>
        <input
          id="quick-assign-start-at"
          v-model="form.startAtLocal"
          type="datetime-local"
          class="block w-full rounded-md border bg-white px-3 py-2 text-[13px] text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky/30"
          :class="errors.startAtLocal ? 'border-rose' : 'border-slate-200'"
          :aria-invalid="errors.startAtLocal ? 'true' : undefined"
          :aria-describedby="errors.startAtLocal ? 'quick-assign-start-error' : undefined"
        />
        <p v-if="errors.startAtLocal" id="quick-assign-start-error" class="mt-1 text-xs text-rose">
          {{ errors.startAtLocal }}
        </p>
      </div>

      <JSelect
        v-model="form.durationMinutes"
        label="Duration"
        :options="durationOptions"
      />
    </form>

    <template #footer>
      <JButton variant="secondary" @click="onToggle(false)">Cancel</JButton>
      <JButton :loading="submitting" @click="submit">Assign</JButton>
    </template>
  </JModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { QuickAssignPayload, QuickAssignTechnicianOption } from '~/types/ui'

const durationValues = [30, 60, 90, 120] as const

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    ticketId: string
    technicians: QuickAssignTechnicianOption[]
    submitting?: boolean
    defaultDurationMinutes?: 30 | 60 | 90 | 120
  }>(),
  {
    submitting: false,
    defaultDurationMinutes: 60
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: QuickAssignPayload]
}>()

const form = reactive({
  technicianId: '',
  startAtLocal: '',
  durationMinutes: String(props.defaultDurationMinutes)
})

const errors = reactive({
  technicianId: '',
  startAtLocal: ''
})

const durationOptions = durationValues.map((value) => ({
  value: String(value),
  label: `${value} min`
}))

const technicianOptions = computed(() =>
  props.technicians.map((technician) => ({
    value: technician.id,
    label: technician.name,
    avatarName: technician.avatarName ?? technician.name,
    jobCount: technician.jobCount
  }))
)

const onToggle = (value: boolean) => {
  emit('update:modelValue', value)
}

const reset = () => {
  form.technicianId = ''
  form.startAtLocal = ''
  form.durationMinutes = String(props.defaultDurationMinutes)
  errors.technicianId = ''
  errors.startAtLocal = ''
}

const validate = () => {
  errors.technicianId = form.technicianId ? '' : 'Technician is required'
  errors.startAtLocal = form.startAtLocal ? '' : 'Start time is required'

  return !errors.technicianId && !errors.startAtLocal
}

const submit = () => {
  if (!validate()) {
    return
  }

  const start = new Date(form.startAtLocal)
  if (Number.isNaN(start.getTime())) {
    errors.startAtLocal = 'Start time is invalid'
    return
  }

  const durationMinutes = Number(form.durationMinutes)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  emit('submit', {
    ticketId: props.ticketId,
    assignedToUserId: form.technicianId,
    scheduledStartAt: start.toISOString(),
    scheduledEndAt: end.toISOString()
  })
}

const formatJobCount = (count: number) => `${count} job${count === 1 ? '' : 's'}`

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reset()
    }
  }
)
</script>
