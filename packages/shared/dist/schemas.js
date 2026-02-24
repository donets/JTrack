import { z } from 'zod';
import { privilegeKeys, roleKeys } from './rbac.js';
export const idSchema = z.string().min(1);
export const timestampSchema = z.string().min(1);
export const roleKeySchema = z.enum(roleKeys);
export const privilegeKeySchema = z.enum(privilegeKeys);
export const userSchema = z.object({
    id: idSchema,
    email: z.string().email(),
    name: z.string().min(1),
    isAdmin: z.boolean(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema
});
export const locationSchema = z.object({
    id: idSchema,
    name: z.string().min(1),
    timezone: z.string().min(1),
    address: z.string().nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema
});
export const userLocationStatusSchema = z.enum(['invited', 'active', 'suspended']);
export const userLocationSchema = z.object({
    userId: idSchema,
    locationId: idSchema,
    role: roleKeySchema,
    status: userLocationStatusSchema,
    createdAt: timestampSchema
});
export const ticketStatusSchema = z.enum([
    'New',
    'Scheduled',
    'InProgress',
    'Done',
    'Invoiced',
    'Paid',
    'Canceled'
]);
export const ticketSchema = z.object({
    id: idSchema,
    locationId: idSchema,
    createdByUserId: idSchema,
    assignedToUserId: idSchema.nullable(),
    title: z.string().min(1),
    description: z.string().nullable(),
    status: ticketStatusSchema,
    scheduledStartAt: timestampSchema.nullable(),
    scheduledEndAt: timestampSchema.nullable(),
    priority: z.string().nullable(),
    totalAmountCents: z.number().int().nullable(),
    currency: z.string().default('EUR'),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    deletedAt: timestampSchema.nullable()
});
export const ticketCommentSchema = z.object({
    id: idSchema,
    ticketId: idSchema,
    locationId: idSchema,
    authorUserId: idSchema,
    body: z.string().min(1),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    deletedAt: timestampSchema.nullable()
});
export const attachmentKindSchema = z.enum(['Photo', 'File']);
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
});
export const paymentProviderSchema = z.enum(['manual', 'stripe']);
export const paymentStatusSchema = z.enum(['Pending', 'Succeeded', 'Failed', 'Refunded']);
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
});
export const loginInputSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});
export const authResponseSchema = z.object({
    accessToken: z.string().min(1),
    user: userSchema
});
export const inviteCompleteInputSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8)
});
export const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(8).optional(),
    role: roleKeySchema.optional(),
    locationId: idSchema.optional()
});
export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    isAdmin: z.boolean().optional()
});
export const inviteResponseSchema = z.object({
    ok: z.literal(true),
    userId: idSchema,
    status: z.literal('invited'),
    onboardingToken: z.string().min(1),
    onboardingUrl: z.string().min(1)
});
export const createLocationSchema = z.object({
    name: z.string().min(1),
    timezone: z.string().min(1),
    address: z.string().optional()
});
export const updateLocationSchema = z.object({
    name: z.string().min(1).optional(),
    timezone: z.string().min(1).optional(),
    address: z.string().nullable().optional()
});
export const createTicketSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    assignedToUserId: idSchema.optional(),
    scheduledStartAt: timestampSchema.optional(),
    scheduledEndAt: timestampSchema.optional(),
    priority: z.string().optional(),
    totalAmountCents: z.number().int().nonnegative().optional(),
    currency: z.string().default('EUR')
});
export const updateTicketSchema = createTicketSchema
    .partial()
    .extend({
    status: ticketStatusSchema.optional()
});
const paginationLimitSchema = z.coerce.number().int().min(1).max(200);
const paginationOffsetSchema = z.coerce.number().int().min(0);
export const ticketListQuerySchema = z.object({
    status: ticketStatusSchema.optional(),
    assignedToUserId: idSchema.optional(),
    limit: paginationLimitSchema.default(50),
    offset: paginationOffsetSchema.default(0)
});
export const ticketListResponseSchema = z.object({
    items: z.array(ticketSchema),
    page: z.object({
        limit: z.number().int().positive(),
        offset: z.number().int().nonnegative(),
        nextOffset: z.number().int().nonnegative().nullable(),
        hasMore: z.boolean()
    })
});
export const createCommentSchema = z.object({
    ticketId: idSchema,
    body: z.string().min(1)
});
export const createAttachmentMetadataSchema = z.object({
    ticketId: idSchema,
    kind: attachmentKindSchema,
    storageKey: z.string().min(1),
    url: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().nonnegative(),
    width: z.number().int().nullable().optional(),
    height: z.number().int().nullable().optional()
});
export const createPaymentRecordSchema = z.object({
    ticketId: idSchema,
    provider: paymentProviderSchema,
    amountCents: z.number().int().nonnegative(),
    currency: z.string().default('EUR'),
    status: paymentStatusSchema.default('Pending')
});
//# sourceMappingURL=schemas.js.map