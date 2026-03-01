import type { TicketStatus } from '@jtrack/shared'

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

export type TimelineEventType =
  | 'comment'
  | 'status_change'
  | 'payment'
  | 'attachment'
  | 'assignment'
  | 'created'

export type TimelineItem = {
  id: string
  type: TimelineEventType
  actor: {
    name: string
    avatarUrl?: string
  }
  content: string
  timestamp: string
  icon?: string
  color?: 'mist' | 'sky' | 'mint' | 'violet' | 'flame' | 'rose'
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
  ticketNumber?: number
  title: string
  status: TicketStatus
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
  toStatus: TicketStatus
}

export type KanbanColumnItem = {
  status: TicketStatus
  label: string
  color?: string
}

export type QuickAssignPayload = {
  ticketId: string
  assignedToUserId: string
  scheduledStartAt: string
  scheduledEndAt: string
}

export type QuickAssignTechnicianOption = {
  id: string
  name: string
  avatarName?: string
  jobCount: number
}

export type DispatchScheduledJob = {
  id: string
  ticketNumber?: number
  title: string
  status: TicketStatus
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

export type DispatchTimeGridContext = {
  date: string
  startHour: number
  endHour: number
  hourSlots: number[]
  labelWidthPx: number
  hourWidthPx: number
}

export type DispatchGanttRowDropPayload = {
  ticketId: string
  technicianId: string
  scheduledStartAt: string
  scheduledEndAt: string
}

export type DispatchGanttRowOpenPayload = {
  ticketId: string
}

export type DispatchMapTicket = {
  id: string
  ticketNumber?: number
  locationId: string
  title: string
  status: TicketStatus
  assignedToUserId: string | null
  scheduledStartAt: string | null
}
