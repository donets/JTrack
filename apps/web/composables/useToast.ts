import { computed } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type ToastInput = {
  message: string
  type: ToastType
  duration?: number
}

export type ToastItem = {
  id: string
  message: string
  type: ToastType
  duration: number
}

const DEFAULT_DURATION = 4000
const timers = new Map<string, ReturnType<typeof setTimeout>>()

const createToastId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const useToast = () => {
  const toasts = useState<ToastItem[]>('ui-toasts', () => [])

  const dismiss = (id: string) => {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }

    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  const show = (input: ToastInput) => {
    const toast: ToastItem = {
      id: createToastId(),
      message: input.message,
      type: input.type,
      duration: input.duration ?? DEFAULT_DURATION
    }

    toasts.value = [...toasts.value, toast]

    if (process.client && toast.duration > 0) {
      const timer = setTimeout(() => {
        dismiss(toast.id)
      }, toast.duration)
      timers.set(toast.id, timer)
    }

    return toast.id
  }

  const clear = () => {
    for (const timer of timers.values()) {
      clearTimeout(timer)
    }

    timers.clear()
    toasts.value = []
  }

  return {
    toasts: computed(() => toasts.value),
    show,
    dismiss,
    clear
  }
}
