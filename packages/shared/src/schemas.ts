import { z } from 'zod'
import { privilegeKeys, roleKeys } from './rbac.js'

export const idSchema = z.string().min(1)
export const timestampSchema = z.string().min(1)

export const roleKeySchema = z.enum(roleKeys)
export const privilegeKeySchema = z.enum(privilegeKeys)

export const userSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  name: z.string().min(1),
  isAdmin: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
})

export const locationSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  timezone: z.string().min(1),
  address: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
})

export const userLocationStatusSchema = z.enum(['invited', 'active', 'suspended'])

export const userLocationSchema = z.object({
  userId: idSchema,
  locationId: idSchema,
  role: roleKeySchema,
  status: userLocationStatusSchema,
  createdAt: timestampSchema
})

export const ticketStatusSchema = z.enum([
  'New',
  'Scheduled',
  'InProgress',
  'Done',
  'Invoiced',
  'Paid',
  'Canceled'
])

export const ticketActivityTypeSchema = z.enum([
  'status_change',
  'assignment',
  'comment',
  'attachment',
  'payment',
  'created'
])

export const ticketChecklistItemSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  checked: z.boolean()
})

export const ticketSchema = z.object({
  id: idSchema,
  locationId: idSchema,
  ticketNumber: z.number().int().positive().optional(),
  createdByUserId: idSchema,
  assignedToUserId: idSchema.nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  checklist: z.array(ticketChecklistItemSchema).default([]),
  status: ticketStatusSchema,
  scheduledStartAt: timestampSchema.nullable(),
  scheduledEndAt: timestampSchema.nullable(),
  priority: z.string().nullable(),
  totalAmountCents: z.number().int().nullable(),
  currency: z.string().default('EUR'),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.nullable()
})

export const ticketCommentSchema = z.object({
  id: idSchema,
  ticketId: idSchema,
  locationId: idSchema,
  authorUserId: idSchema,
  body: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.nullable()
})

export const ticketActivitySchema = z.object({
  id: idSchema,
  ticketId: idSchema,
  locationId: idSchema,
  userId: idSchema.nullable(),
  type: ticketActivityTypeSchema,
  metadata: z.record(z.unknown()),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
})

export const attachmentKindSchema = z.enum(['Photo', 'File'])

export const ticketAttachmentSchema = z.object({
  id: idSchema,
  ticketId: idSchema,
  locationId: idSchema,
  uploadedByUserId: idSchema,
  kind: attachmentKindSchema,
  storageKey: z.string().min(1),
  url: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.nullable()
})

export const paymentProviderSchema = z.enum(['manual', 'stripe'])
export const paymentStatusSchema = z.enum(['Pending', 'Succeeded', 'Failed', 'Refunded'])

export const paymentRecordSchema = z.object({
  id: idSchema,
  ticketId: idSchema,
  locationId: idSchema,
  provider: paymentProviderSchema,
  amountCents: z.number().int().nonnegative(),
  currency: z.string().min(1),
  status: paymentStatusSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema
})

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1).optional()
})

export const registerInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: passwordSchema,
  locationName: z.string().min(1),
  timezone: z.string().min(1),
  address: z.string().optional()
})

export const verifyEmailRequestInputSchema = z.object({
  email: z.string().email()
})

export const verifyEmailConfirmInputSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits')
})

export const forgotPasswordInputSchema = z.object({
  email: z.string().email()
})

export const resetPasswordInputSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
  newPassword: passwordSchema
})

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema
})

export const healthStatusSchema = z.enum(['ok', 'degraded'])
export const healthDatabaseStatusSchema = z.enum(['up', 'down'])

export const healthResponseSchema = z.object({
  status: healthStatusSchema,
  database: healthDatabaseStatusSchema,
  version: z.string().min(1)
})

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: userSchema
})

export const inviteCompleteInputSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema
})

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
  role: roleKeySchema.optional(),
  locationId: idSchema.optional()
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  isAdmin: z.boolean().optional(),
  role: roleKeySchema.optional(),
  membershipStatus: userLocationStatusSchema.optional()
})

export const inviteResponseSchema = z.object({
  ok: z.literal(true),
  userId: idSchema,
  status: z.literal('invited'),
  onboardingToken: z.string().min(1),
  onboardingUrl: z.string().min(1)
})

export const createLocationSchema = z.object({
  name: z.string().min(1),
  timezone: z.string().min(1),
  address: z.string().optional()
})

export const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
  address: z.string().nullable().optional()
})

export const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  checklist: z.array(ticketChecklistItemSchema).optional(),
  assignedToUserId: idSchema.optional(),
  scheduledStartAt: timestampSchema.optional(),
  scheduledEndAt: timestampSchema.optional(),
  priority: z.string().optional(),
  totalAmountCents: z.number().int().nonnegative().optional(),
  currency: z.string().default('EUR')
})

export const updateTicketSchema = createTicketSchema
  .partial()
  .extend({
    status: ticketStatusSchema.optional()
  })

export const ticketStatusUpdateInputSchema = z.object({
  status: ticketStatusSchema
})

const paginationLimitSchema = z.coerce.number().int().min(1).max(200)
const paginationOffsetSchema = z.coerce.number().int().min(0)

export const ticketListQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  assignedToUserId: idSchema.optional(),
  limit: paginationLimitSchema.default(50),
  offset: paginationOffsetSchema.default(0)
})

export const ticketListResponseSchema = z.object({
  items: z.array(ticketSchema),
  page: z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    nextOffset: z.number().int().nonnegative().nullable(),
    hasMore: z.boolean()
  })
})

export const createCommentSchema = z.object({
  ticketId: idSchema,
  body: z.string().min(1)
})

export const createAttachmentMetadataSchema = z.object({
  ticketId: idSchema,
  kind: attachmentKindSchema,
  storageKey: z.string().min(1),
  url: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional()
})

export const presignInputSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1)
})

export const uploadInputSchema = z.object({
  base64: z.string().min(1)
})

export const createPaymentRecordSchema = z.object({
  ticketId: idSchema,
  provider: paymentProviderSchema,
  amountCents: z.number().int().nonnegative(),
  currency: z.string().default('EUR'),
  status: paymentStatusSchema.default('Pending')
})

export const paymentStatusUpdateInputSchema = z.object({
  status: paymentStatusSchema
})

export type User = z.infer<typeof userSchema>
export type Location = z.infer<typeof locationSchema>
export type UserLocation = z.infer<typeof userLocationSchema>
export type UserLocationStatus = z.infer<typeof userLocationStatusSchema>
export type TicketStatus = z.infer<typeof ticketStatusSchema>
export type TicketActivityType = z.infer<typeof ticketActivityTypeSchema>
export type TicketChecklistItem = z.infer<typeof ticketChecklistItemSchema>
export type Ticket = z.infer<typeof ticketSchema>
export type TicketComment = z.infer<typeof ticketCommentSchema>
export type TicketActivity = z.infer<typeof ticketActivitySchema>
export type AttachmentKind = z.infer<typeof attachmentKindSchema>
export type TicketAttachment = z.infer<typeof ticketAttachmentSchema>
export type PaymentProvider = z.infer<typeof paymentProviderSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type PaymentRecord = z.infer<typeof paymentRecordSchema>
export type LoginInput = z.infer<typeof loginInputSchema>
export type RefreshInput = z.infer<typeof refreshInputSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type InviteCompleteInput = z.infer<typeof inviteCompleteInputSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type InviteResponse = z.infer<typeof inviteResponseSchema>
export type CreateLocationInput = z.infer<typeof createLocationSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>
export type UpdateTicketStatusInput = z.infer<typeof ticketStatusUpdateInputSchema>
export type TicketListQuery = z.infer<typeof ticketListQuerySchema>
export type TicketListResponse = z.infer<typeof ticketListResponseSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type CreateAttachmentMetadataInput = z.infer<typeof createAttachmentMetadataSchema>
export type PresignInput = z.infer<typeof presignInputSchema>
export type UploadInput = z.infer<typeof uploadInputSchema>
export type CreatePaymentRecordInput = z.infer<typeof createPaymentRecordSchema>
export type UpdatePaymentStatusInput = z.infer<typeof paymentStatusUpdateInputSchema>
export type RegisterInput = z.infer<typeof registerInputSchema>
export type VerifyEmailRequestInput = z.infer<typeof verifyEmailRequestInputSchema>
export type VerifyEmailConfirmInput = z.infer<typeof verifyEmailConfirmInputSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>
