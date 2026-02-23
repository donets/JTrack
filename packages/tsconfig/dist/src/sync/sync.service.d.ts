import { type SyncPullResponse, type SyncPushResponse } from '@jtrack/shared';
import { PrismaService } from '@/prisma/prisma.service';
export declare class SyncService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    pull(rawBody: unknown, activeLocationId: string): Promise<SyncPullResponse>;
    push(rawBody: unknown, activeLocationId: string): Promise<SyncPushResponse>;
    private applyTicketChanges;
    private applyCommentChanges;
    private applyAttachmentChanges;
    private applyPaymentChanges;
    private serializeTicket;
    private serializeComment;
    private serializeAttachment;
    private serializePayment;
}
