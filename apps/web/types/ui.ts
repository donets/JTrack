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
  rowHeader?: boolean
  hideClass?: string
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

export type BadgeVariant = 'mint' | 'flame' | 'sky' | 'rose' | 'violet' | 'mist'

export type KanbanTicketCardItem = {
  id: string
  title: string
  status: string
  priority: string | null
  assignedToUserId: string | null
  assigneeName?: string
  dueAt?: string | null
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  updatedAt: string
}

export type KanbanColumnDropPayload = {
  ticketId: string
  toStatus: string
}

export type KanbanColumnItem = {
  status: string
  label: string
}

export type QuickAssignPayload = {
  ticketId: string
  assignedToUserId: string
  scheduledStartAt: string
  scheduledEndAt: string
}

export type DispatchScheduledJob = {
  id: string
  title: string
  status: string
  priority: string | null
  ticketCode?: string
  assignedToUserId: string | null
  scheduledStartAt: string | null
  scheduledEndAt: string | null
}

export type DispatchTechnician = {
  id: string
  name: string
  avatarName?: string
  role: string
  jobs: DispatchScheduledJob[]
}

export type DispatchTimeGridNavEvent = {
  date: string
}
