import { z } from 'zod';
import { idSchema, paymentRecordSchema, ticketAttachmentSchema, ticketCommentSchema, ticketSchema } from './schemas.js';
export const syncEntityChangesSchema = (entitySchema) => z.object({
    created: z.array(entitySchema),
    updated: z.array(entitySchema),
    deleted: z.array(idSchema)
});
export const syncChangesSchema = z.object({
    tickets: syncEntityChangesSchema(ticketSchema),
    ticketComments: syncEntityChangesSchema(ticketCommentSchema),
    ticketAttachments: syncEntityChangesSchema(ticketAttachmentSchema),
    paymentRecords: syncEntityChangesSchema(paymentRecordSchema)
});
const syncPullLimitSchema = z.number().int().min(1).max(200);
export const syncPullCursorSchema = z.object({
    snapshotAt: z.number().int().nonnegative(),
    ticketsOffset: z.number().int().nonnegative(),
    ticketCommentsOffset: z.number().int().nonnegative(),
    ticketAttachmentsOffset: z.number().int().nonnegative(),
    paymentRecordsOffset: z.number().int().nonnegative()
});
export const syncPullRequestSchema = z.object({
    locationId: idSchema,
    lastPulledAt: z.number().int().nullable(),
    limit: syncPullLimitSchema.default(100),
    cursor: syncPullCursorSchema.nullable().optional().default(null)
});
export const syncPullResponseSchema = z.object({
    changes: syncChangesSchema,
    timestamp: z.number().int(),
    hasMore: z.boolean().default(false),
    nextCursor: syncPullCursorSchema.nullable().optional().default(null)
});
export const syncPushRequestSchema = z.object({
    locationId: idSchema,
    lastPulledAt: z.number().int().nullable(),
    changes: syncChangesSchema,
    clientId: z.string().min(1)
});
export const syncPushResponseSchema = z.object({
    ok: z.literal(true),
    newTimestamp: z.number().int()
});
//# sourceMappingURL=sync.js.map