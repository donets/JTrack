<template>
  <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
    <p class="text-slate-500">
      Showing {{ rangeStart }}-{{ rangeEnd }} of {{ total }}
    </p>

    <div class="flex items-center gap-1">
      <button
        type="button"
        class="rounded border border-slate-200 bg-mist px-2.5 py-1 text-xs font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="normalizedPage <= 1"
        @click="goToPage(normalizedPage - 1)"
      >
        Prev
      </button>

      <button
        v-for="page in visiblePages"
        :key="page"
        type="button"
        class="rounded border px-2.5 py-1 text-xs font-semibold"
        :class="
          page === normalizedPage
            ? 'border-mint bg-mint text-white'
            : 'border-slate-200 bg-white text-ink hover:bg-mist'
        "
        @click="goToPage(page)"
      >
        {{ page }}
      </button>

      <button
        type="button"
        class="rounded border border-slate-200 bg-mist px-2.5 py-1 text-xs font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="normalizedPage >= totalPages"
        @click="goToPage(normalizedPage + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  perPage: number
  currentPage: number
}>()

const emit = defineEmits<{
  'page-change': [page: number]
  'update:currentPage': [page: number]
}>()

const safePerPage = computed(() => (props.perPage > 0 ? props.perPage : 1))

const totalPages = computed(() => {
  if (props.total <= 0) {
    return 1
  }

  return Math.ceil(props.total / safePerPage.value)
})

const normalizedPage = computed(() =>
  Math.min(Math.max(props.currentPage, 1), totalPages.value)
)

const rangeStart = computed(() => {
  if (props.total <= 0) {
    return 0
  }

  return (normalizedPage.value - 1) * safePerPage.value + 1
})

const rangeEnd = computed(() => {
  if (props.total <= 0) {
    return 0
  }

  return Math.min(normalizedPage.value * safePerPage.value, props.total)
})

const visiblePages = computed(() => {
  if (totalPages.value <= 5) {
    return Array.from({ length: totalPages.value }, (_, index) => index + 1)
  }

  const start = Math.max(1, normalizedPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  const shiftedStart = Math.max(1, end - 4)

  return Array.from({ length: end - shiftedStart + 1 }, (_, index) => shiftedStart + index)
})

const goToPage = (page: number) => {
  const nextPage = Math.min(Math.max(page, 1), totalPages.value)
  if (nextPage === normalizedPage.value) {
    return
  }

  emit('update:currentPage', nextPage)
  emit('page-change', nextPage)
}
</script>
