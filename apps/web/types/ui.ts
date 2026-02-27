export type DropdownItem = {
  label: string
  icon?: string
  action?: () => void | Promise<void>
  variant?: 'default' | 'danger'
}

export type TableColumn = {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}

export type TimelineEventType = 'comment' | 'status_change' | 'payment' | 'attachment'

export type TimelineItem = {
  id: string
  type: TimelineEventType
  actor: {
    name: string
    avatarUrl?: string
  }
  content: string
  timestamp: string
}

export type TabItem = {
  key: string
  label: string
  count?: number
}

export type BreadcrumbItem = {
  label: string
  to?: string
}
