/**
 * JTrack domain and API models (documentation-oriented TypeScript contracts).
 * Source of truth in runtime code is Prisma schema + Zod schemas in packages/shared.
 */

export type UUID = string
export type IsoDateTime = string
export type UnixMs = number

export type RoleKey = 'Owner' | 'Manager' | 'Technician'
export type UserLocationStatus = 'invited' | 'active' | 'suspended'

export type TicketStatus =
  | 'New'
  | 'Scheduled'
  | 'InProgress'
  | 'Done'
  | 'Invoiced'
  | 'Paid'
  | 'Canceled'

export type TicketActivityType =
  | 'status_change'
  | 'assignment'
  | 'comment'
  | 'attachment'
  | 'payment'
  | 'created'

export type AuthTokenType = 'EmailVerification' | 'PasswordReset' | 'InviteAccept'

export type AttachmentKind = 'Photo' | 'File'
export type PaymentProvider = 'manual' | 'stripe'
export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Refunded'

export interface User {
  id: UUID
  email: string
  name: string
  isAdmin: boolean
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface Location {
  id: UUID
  name: string
  timezone: string
  address: string | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface UserLocation {
  userId: UUID
  locationId: UUID
  role: RoleKey
  status: UserLocationStatus
  createdAt: IsoDateTime
}

export interface UserWithMembership extends User {
  role: RoleKey
  membershipStatus: UserLocationStatus
}

export interface LocationWithMembership extends Location {
  role: RoleKey
  membershipStatus: UserLocationStatus
}

export interface Ticket {
  id: UUID
  locationId: UUID
  ticketNumber: number
  createdByUserId: UUID
  assignedToUserId: UUID | null
  title: string
  description: string | null
  checklist: TicketChecklistItem[]
  status: TicketStatus
  scheduledStartAt: IsoDateTime | null
  scheduledEndAt: IsoDateTime | null
  priority: string | null
  totalAmountCents: number | null
  currency: string
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  deletedAt: IsoDateTime | null
}

export interface TicketChecklistItem {
  id: string
  label: string
  checked: boolean
}

export interface TicketComment {
  id: UUID
  ticketId: UUID
  locationId: UUID
  authorUserId: UUID
  body: string
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  deletedAt: IsoDateTime | null
}

export interface TicketActivity {
  id: UUID
  ticketId: UUID
  locationId: UUID
  userId: UUID | null
  type: TicketActivityType
  metadata: Record<string, unknown>
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface TicketAttachment {
  id: UUID
  ticketId: UUID
  locationId: UUID
  uploadedByUserId: UUID
  kind: AttachmentKind
  storageKey: string
  url: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  deletedAt: IsoDateTime | null
}

export interface PaymentRecord {
  id: UUID
  ticketId: UUID
  locationId: UUID
  provider: PaymentProvider
  amountCents: number
  currency: string
  status: PaymentStatus
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface AuthToken {
  id: UUID
  userId: UUID
  type: AuthTokenType
  tokenHash: string
  expiresAt: IsoDateTime
  consumedAt: IsoDateTime | null
  createdAt: IsoDateTime
  createdByIp: string | null
  userAgent: string | null
}

export interface Session {
  id: UUID
  userId: UUID
  refreshTokenHash: string
  createdAt: IsoDateTime
  lastUsedAt: IsoDateTime
  revokedAt: IsoDateTime | null
  ip: string | null
  userAgent: string | null
}

export interface TicketDetails extends Ticket {
  comments: TicketComment[]
  attachments: TicketAttachment[]
  paymentRecords: PaymentRecord[]
}

export interface RoleWithPrivileges {
  key: RoleKey
  name: string
  privileges: string[]
}

export interface Privilege {
  key: string
  description: string | null
}

export interface LoginInput {
  email: string
  password: string
}

export interface RefreshInput {
  refreshToken?: string
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  database: 'up' | 'down'
  version: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface RegisterInput {
  email: string
  name: string
  password: string
  locationName: string
  timezone: string
  address?: string
}

export interface VerifyEmailRequestInput {
  email: string
}

export interface VerifyEmailConfirmInput {
  email: string
  code: string
}

export interface ForgotPasswordInput {
  email: string
}

export interface ResetPasswordInput {
  email: string
  code: string
  newPassword: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface InviteCompleteInput {
  token: string
  password: string
}

export interface CreateUserInput {
  email: string
  name: string
  password?: string
  role?: RoleKey
  locationId?: UUID
}

export interface UpdateUserInput {
  name?: string
  isAdmin?: boolean
  role?: RoleKey
  membershipStatus?: UserLocationStatus
}

export interface InviteResponse {
  ok: true
  userId: UUID
  status: 'invited'
  onboardingToken: string
  onboardingUrl: string
}

export interface CreateLocationInput {
  name: string
  timezone: string
  address?: string
}

export interface UpdateLocationInput {
  name?: string
  timezone?: string
  address?: string | null
}

export interface CreateTicketInput {
  title: string
  description?: string
  checklist?: TicketChecklistItem[]
  assignedToUserId?: UUID
  scheduledStartAt?: IsoDateTime
  scheduledEndAt?: IsoDateTime
  priority?: string
  totalAmountCents?: number
  currency?: string
}

export interface UpdateTicketInput extends Partial<CreateTicketInput> {}

export interface UpdateTicketStatusInput {
  status: TicketStatus
}

export interface TicketListQuery {
  status?: TicketStatus
  assignedToUserId?: UUID
  limit?: number
  offset?: number
}

export interface OffsetPage {
  limit: number
  offset: number
  nextOffset: number | null
  hasMore: boolean
}

export interface TicketListResponse {
  items: Ticket[]
  page: OffsetPage
}

export interface CreateCommentInput {
  ticketId: UUID
  body: string
}

export interface UpdateCommentInput {
  body: string
}

export interface PresignInput {
  fileName: string
  mimeType: string
}

export interface PresignedUpload {
  storageKey: string
  uploadUrl: string
  headers: Record<string, string>
}

export interface UploadInput {
  base64: string
}

export interface UploadResponse {
  url: string
  size: number
}

export interface CreateAttachmentMetadataInput {
  ticketId: UUID
  kind: AttachmentKind
  storageKey: string
  url: string
  mimeType: string
  size: number
  width?: number | null
  height?: number | null
}

export interface CreatePaymentRecordInput {
  ticketId: UUID
  provider: PaymentProvider
  amountCents: number
  currency?: string
  status?: PaymentStatus
}

export interface UpdatePaymentStatusInput {
  status: PaymentStatus
}

export interface SyncEntityChanges<T> {
  created: T[]
  updated: T[]
  deleted: UUID[]
}

export interface SyncChanges {
  tickets: SyncEntityChanges<Ticket>
  ticketActivities: SyncEntityChanges<TicketActivity>
  ticketComments: SyncEntityChanges<TicketComment>
  ticketAttachments: SyncEntityChanges<TicketAttachment>
  paymentRecords: SyncEntityChanges<PaymentRecord>
}

export interface SyncPullRequest {
  locationId: UUID
  lastPulledAt: UnixMs | null
  limit?: number
  cursor?: SyncPullCursor | null
}

export interface SyncPullCursor {
  snapshotAt: UnixMs
  ticketsOffset: number
  ticketActivitiesOffset: number
  ticketCommentsOffset: number
  ticketAttachmentsOffset: number
  paymentRecordsOffset: number
}

export interface SyncPullResponse {
  changes: SyncChanges
  timestamp: UnixMs
  hasMore: boolean
  nextCursor: SyncPullCursor | null
}

export interface SyncPushRequest {
  locationId: UUID
  lastPulledAt: UnixMs | null
  changes: SyncChanges
  clientId: string
}

export interface SyncPushResponse {
  ok: true
  newTimestamp: UnixMs
}

export interface OkResponse {
  ok: true
}
