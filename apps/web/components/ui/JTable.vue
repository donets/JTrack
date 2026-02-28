<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
    <table class="min-w-full text-sm">
      <thead class="bg-slate-50">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :class="headerClasses(column)"
            :style="column.width ? { width: column.width } : undefined"
            :aria-sort="ariaSort(column)"
          >
            <button
              v-if="canSortColumn(column)"
              type="button"
              class="inline-flex items-center gap-1"
              @click="toggleSort(column.key)"
            >
              <span class="inline-flex items-center gap-1">
                <span>{{ column.label }}</span>
                <svg
                  v-if="activeSortKey === column.key"
                  class="h-3.5 w-3.5"
                  :class="activeSortDirection === 'desc' ? 'rotate-180' : ''"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span v-else class="h-3.5 w-3.5" />
              </span>
            </button>
            <span v-else>{{ column.label }}</span>
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-slate-100">
        <template v-if="loading">
          <tr v-for="index in skeletonRows" :key="`skeleton-${index}`">
            <td
              v-for="column in columns"
              :key="`${index}-${column.key}`"
              :class="cellClasses(column)"
            >
              <div class="h-3 animate-pulse rounded bg-slate-200" />
            </td>
          </tr>
        </template>

        <template v-else-if="sortedRows.length > 0">
          <tr
            v-for="row in sortedRows"
            :key="rowKey(row)"
            :class="rowClasses"
            @click="onRowClick($event, row)"
          >
            <component
              :is="column.rowHeader ? 'th' : 'td'"
              v-for="column in columns"
              :key="`${rowKey(row)}-${column.key}`"
              :class="cellClasses(column)"
              :scope="column.rowHeader ? 'row' : undefined"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="row[column.key]"
                :column="column"
              >
                {{ row[column.key] ?? '—' }}
              </slot>
            </component>
          </tr>
        </template>

        <tr v-else>
          <td class="px-4 py-6 text-center text-sm text-slate-500" :colspan="columns.length">
            {{ emptyText }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TableColumn } from '~/types/ui'

type SortDirection = 'asc' | 'desc'

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    rows: Record<string, any>[]
    sortable?: boolean
    loading?: boolean
    emptyText?: string
    sortKey?: string | null
    sortDirection?: SortDirection
    rowClickable?: boolean
  }>(),
  {
    sortable: false,
    loading: false,
    emptyText: 'No data',
    sortKey: undefined,
    sortDirection: undefined,
    rowClickable: false
  }
)

const emit = defineEmits<{
  'sort-change': [payload: { key: string; direction: SortDirection }]
  'row-click': [row: Record<string, any>]
}>()

const internalSortKey = ref<string | null>(null)
const internalSortDirection = ref<SortDirection>('asc')

const skeletonRows = 5
const usesControlledSorting = computed(() => props.sortKey !== undefined)

const activeSortKey = computed(() =>
  usesControlledSorting.value ? (props.sortKey ?? null) : internalSortKey.value
)

const activeSortDirection = computed<SortDirection>(() =>
  usesControlledSorting.value ? (props.sortDirection ?? 'asc') : internalSortDirection.value
)

const canSortColumn = (column: TableColumn) => props.sortable && Boolean(column.sortable)

const toggleSort = (columnKey: string) => {
  const currentKey = activeSortKey.value
  const currentDirection = activeSortDirection.value
  const nextDirection: SortDirection =
    currentKey === columnKey ? (currentDirection === 'asc' ? 'desc' : 'asc') : 'asc'

  if (!usesControlledSorting.value) {
    internalSortKey.value = columnKey
    internalSortDirection.value = nextDirection
  }

  emit('sort-change', { key: columnKey, direction: nextDirection })
}

const rowClasses = computed(() =>
  props.rowClickable ? 'cursor-pointer transition-colors hover:bg-slate-50' : 'hover:bg-slate-50/60'
)

const onRowClick = (event: MouseEvent, row: Record<string, any>) => {
  if (!props.rowClickable) {
    return
  }

  const target = event.target as HTMLElement | null
  if (target?.closest('a,button,input,select,textarea,label,[role="button"],[role="link"],[data-row-click-ignore]')) {
    return
  }

  emit('row-click', row)
}

const ariaSort = (column: TableColumn) => {
  if (!canSortColumn(column)) {
    return undefined
  }

  if (activeSortKey.value !== column.key) {
    return 'none'
  }

  return activeSortDirection.value === 'asc' ? 'ascending' : 'descending'
}

const normalizeSortValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  return String(value).toLowerCase()
}

const sortedRows = computed(() => {
  const list = [...props.rows]
  if (usesControlledSorting.value) {
    return list
  }

  if (!activeSortKey.value) {
    return list
  }

  const key = activeSortKey.value
  const multiplier = activeSortDirection.value === 'asc' ? 1 : -1

  return list.sort((left, right) => {
    const leftValue = normalizeSortValue(left[key])
    const rightValue = normalizeSortValue(right[key])

    if (leftValue < rightValue) {
      return -1 * multiplier
    }

    if (leftValue > rightValue) {
      return 1 * multiplier
    }

    return 0
  })
})

const rowKey = (row: Record<string, any>) => row.id ?? JSON.stringify(row)

const alignClass = (align: TableColumn['align']) => {
  if (align === 'center') {
    return 'text-center'
  }

  if (align === 'right') {
    return 'text-right'
  }

  return 'text-left'
}

const headerClasses = (column: TableColumn) =>
  [
    canSortColumn(column)
      ? 'cursor-pointer select-none px-3 py-3.5 text-left text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:px-5'
      : 'px-3 py-3.5 text-left text-sm font-medium text-slate-600 sm:px-5',
    alignClass(column.align),
    column.hideClass ?? ''
  ]
    .filter(Boolean)
    .join(' ')

const cellClasses = (column: TableColumn) =>
  [
    'px-3 py-4 text-sm sm:px-5',
    alignClass(column.align),
    column.rowHeader ? 'font-medium text-slate-900' : '',
    column.hideClass ?? ''
  ]
    .filter(Boolean)
    .join(' ')
</script>
