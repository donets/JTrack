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
export const syncPullRequestSchema = z.object({
    locationId: idSchema,
    lastPulledAt: z.number().int().nullable()
});
export const syncPullResponseSchema = z.object({
    changes: syncChangesSchema,
    timestamp: z.number().int()
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