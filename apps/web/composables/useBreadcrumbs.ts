import { computed, ref } from 'vue'
import type { BreadcrumbItem } from '~/types/ui'

const breadcrumbs = ref<BreadcrumbItem[]>([])

export function useBreadcrumbs() {
  const setBreadcrumbs = (items: BreadcrumbItem[]) => {
    breadcrumbs.value = [...items]
  }

  const clearBreadcrumbs = () => {
    breadcrumbs.value = []
  }

  const title = computed(() => {
    const last = breadcrumbs.value[breadcrumbs.value.length - 1]
    return last?.label ?? ''
  })

  return {
    breadcrumbs,
    title,
    setBreadcrumbs,
    clearBreadcrumbs
  }
}
