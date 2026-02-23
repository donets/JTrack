"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@jtrack/shared");
const prisma_service_1 = require("../prisma/prisma.service");
let SyncService = class SyncService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async pull(rawBody, activeLocationId) {
        const body = shared_1.syncPullRequestSchema.parse(rawBody);
        if (body.locationId !== activeLocationId) {
            throw new common_1.ForbiddenException('Body locationId must match x-location-id');
        }
        const lastPulledAt = body.lastPulledAt ?? 0;
        const since = new Date(lastPulledAt);
        const [tickets, ticketComments, ticketAttachments, paymentRecords] = await Promise.all([
            this.prisma.ticket.findMany({
                where: {
                    locationId: body.locationId,
                    OR: [{ updatedAt: { gt: since } }, { deletedAt: { gt: since } }]
                },
                orderBy: { updatedAt: 'asc' }
            }),
            this.prisma.ticketComment.findMany({
                where: {
                    locationId: body.locationId,
                    OR: [{ updatedAt: { gt: since } }, { deletedAt: { gt: since } }]
                },
                orderBy: { updatedAt: 'asc' }
            }),
            this.prisma.ticketAttachment.findMany({
                where: {
                    locationId: body.locationId,
                    OR: [{ updatedAt: { gt: since } }, { deletedAt: { gt: since } }]
                },
                orderBy: { updatedAt: 'asc' }
            }),
            this.prisma.paymentRecord.findMany({
                where: {
                    locationId: body.locationId,
                    updatedAt: { gt: since }
                },
                orderBy: { updatedAt: 'asc' }
            })
        ]);
        const changes = {
            tickets: { created: [], updated: [], deleted: [] },
            ticketComments: { created: [], updated: [], deleted: [] },
            ticketAttachments: { created: [], updated: [], deleted: [] },
            paymentRecords: { created: [], updated: [], deleted: [] }
        };
        for (const ticket of tickets) {
            if (ticket.deletedAt && ticket.deletedAt.getTime() > lastPulledAt) {
                changes.tickets.deleted.push(ticket.id);
            }
            else if (ticket.createdAt.getTime() > lastPulledAt) {
                changes.tickets.created.push(this.serializeTicket(ticket));
            }
            else {
                changes.tickets.updated.push(this.serializeTicket(ticket));
            }
        }
        for (const comment of ticketComments) {
            if (comment.deletedAt && comment.deletedAt.getTime() > lastPulledAt) {
                changes.ticketComments.deleted.push(comment.id);
            }
            else if (comment.createdAt.getTime() > lastPulledAt) {
                changes.ticketComments.created.push(this.serializeComment(comment));
            }
            else {
                changes.ticketComments.updated.push(this.serializeComment(comment));
            }
        }
        for (const attachment of ticketAttachments) {
            if (attachment.deletedAt && attachment.deletedAt.getTime() > lastPulledAt) {
                changes.ticketAttachments.deleted.push(attachment.id);
            }
            else if (attachment.createdAt.getTime() > lastPulledAt) {
                changes.ticketAttachments.created.push(this.serializeAttachment(attachment));
            }
            else {
                changes.ticketAttachments.updated.push(this.serializeAttachment(attachment));
            }
        }
        for (const payment of paymentRecords) {
            if (payment.createdAt.getTime() > lastPulledAt) {
                changes.paymentRecords.created.push(this.serializePayment(payment));
            }
            else {
                changes.paymentRecords.updated.push(this.serializePayment(payment));
            }
        }
        return {
            changes,
            timestamp: Date.now()
        };
    }
    async push(rawBody, activeLocationId) {
        const body = shared_1.syncPushRequestSchema.parse(rawBody);
        if (body.locationId !== activeLocationId) {
            throw new common_1.ForbiddenException('Body locationId must match x-location-id');
        }
        const lastPulledAt = new Date(body.lastPulledAt ?? 0);
        const now = new Date();
        await this.prisma.$transaction(async (tx) => {
            await this.applyTicketChanges(tx, body.locationId, body.changes, lastPulledAt, now);
            await this.applyCommentChanges(tx, body.locationId, body.changes, lastPulledAt, now);
            await this.applyAttachmentChanges(tx, body.locationId, body.changes, lastPulledAt, now);
            await this.applyPaymentChanges(tx, body.locationId, body.changes, lastPulledAt, now);
        });
        return {
            ok: true,
            newTimestamp: now.getTime()
        };
    }
    async applyTicketChanges(tx, locationId, changes, lastPulledAt, now) {
        for (const record of [...changes.tickets.created, ...changes.tickets.updated]) {
            const existing = await tx.ticket.findUnique({ where: { id: record.id } });
            if (existing && (existing.locationId !== locationId || existing.updatedAt > lastPulledAt)) {
                continue;
            }
            if (existing) {
                await tx.ticket.update({
                    where: { id: record.id },
                    data: {
                        title: record.title,
                        description: record.description,
                        status: record.status,
                        assignedToUserId: record.assignedToUserId,
                        scheduledStartAt: record.scheduledStartAt ? new Date(record.scheduledStartAt) : null,
                        scheduledEndAt: record.scheduledEndAt ? new Date(record.scheduledEndAt) : null,
                        priority: record.priority,
                        totalAmountCents: record.totalAmountCents,
                        currency: record.currency,
                        updatedAt: now,
                        deletedAt: null
                    }
                });
            }
            else {
                await tx.ticket.create({
                    data: {
                        id: record.id,
                        locationId,
                        createdByUserId: record.createdByUserId,
                        assignedToUserId: record.assignedToUserId,
                        title: record.title,
                        description: record.description,
                        status: record.status,
                        scheduledStartAt: record.scheduledStartAt ? new Date(record.scheduledStartAt) : null,
                        scheduledEndAt: record.scheduledEndAt ? new Date(record.scheduledEndAt) : null,
                        priority: record.priority,
                        totalAmountCents: record.totalAmountCents,
                        currency: record.currency,
                        createdAt: new Date(record.createdAt),
                        updatedAt: now
                    }
                });
            }
        }
        for (const deletedId of changes.tickets.deleted) {
            const existing = await tx.ticket.findUnique({ where: { id: deletedId } });
            if (!existing || existing.locationId !== locationId || existing.updatedAt > lastPulledAt) {
                continue;
            }
            await tx.ticket.update({
                where: { id: deletedId },
                data: {
                    deletedAt: now,
                    updatedAt: now
                }
            });
        }
    }
    async applyCommentChanges(tx, locationId, changes, lastPulledAt, now) {
        for (const record of [...changes.ticketComments.created, ...changes.ticketComments.updated]) {
            const existing = await tx.ticketComment.findUnique({ where: { id: record.id } });
            if (existing && (existing.locationId !== locationId || existing.updatedAt > lastPulledAt)) {
                continue;
            }
            if (existing) {
                await tx.ticketComment.update({
                    where: { id: record.id },
                    data: {
                        body: record.body,
                        updatedAt: now,
                        deletedAt: null
                    }
                });
            }
            else {
                await tx.ticketComment.create({
                    data: {
                        id: record.id,
                        ticketId: record.ticketId,
                        locationId,
                        authorUserId: record.authorUserId,
                        body: record.body,
                        createdAt: new Date(record.createdAt),
                        updatedAt: now
                    }
                });
            }
        }
        for (const deletedId of changes.ticketComments.deleted) {
            const existing = await tx.ticketComment.findUnique({ where: { id: deletedId } });
            if (!existing || existing.locationId !== locationId || existing.updatedAt > lastPulledAt) {
                continue;
            }
            await tx.ticketComment.update({
                where: { id: deletedId },
                data: {
                    deletedAt: now,
                    updatedAt: now
                }
            });
        }
    }
    async applyAttachmentChanges(tx, locationId, changes, lastPulledAt, now) {
        for (const record of [...changes.ticketAttachments.created, ...changes.ticketAttachments.updated]) {
            const existing = await tx.ticketAttachment.findUnique({ where: { id: record.id } });
            if (existing && (existing.locationId !== locationId || existing.updatedAt > lastPulledAt)) {
                continue;
            }
            if (existing) {
                await tx.ticketAttachment.update({
                    where: { id: record.id },
                    data: {
                        kind: record.kind,
                        storageKey: record.storageKey,
                        url: record.url,
                        mimeType: record.mimeType,
                        size: record.size,
                        width: record.width,
                        height: record.height,
                        updatedAt: now,
                        deletedAt: null
                    }
                });
            }
            else {
                await tx.ticketAttachment.create({
                    data: {
                        id: record.id,
                        ticketId: record.ticketId,
                        locationId,
                        uploadedByUserId: record.uploadedByUserId,
                        kind: record.kind,
                        storageKey: record.storageKey,
                        url: record.url,
                        mimeType: record.mimeType,
                        size: record.size,
                        width: record.width,
                        height: record.height,
                        createdAt: new Date(record.createdAt),
                        updatedAt: now
                    }
                });
            }
        }
        for (const deletedId of changes.ticketAttachments.deleted) {
            const existing = await tx.ticketAttachment.findUnique({ where: { id: deletedId } });
            if (!existing || existing.locationId !== locationId || existing.updatedAt > lastPulledAt) {
                continue;
            }
            await tx.ticketAttachment.update({
                where: { id: deletedId },
                data: {
                    deletedAt: now,
                    updatedAt: now
                }
            });
        }
    }
    async applyPaymentChanges(tx, locationId, changes, lastPulledAt, now) {
        for (const record of [...changes.paymentRecords.created, ...changes.paymentRecords.updated]) {
            const existing = await tx.paymentRecord.findUnique({ where: { id: record.id } });
            if (existing && (existing.locationId !== locationId || existing.updatedAt > lastPulledAt)) {
                continue;
            }
            if (existing) {
                await tx.paymentRecord.update({
                    where: { id: record.id },
                    data: {
                        provider: record.provider,
                        amountCents: record.amountCents,
                        currency: record.currency,
                        status: record.status,
                        updatedAt: now
                    }
                });
            }
            else {
                await tx.paymentRecord.create({
                    data: {
                        id: record.id,
                        locationId,
                        ticketId: record.ticketId,
                        provider: record.provider,
                        amountCents: record.amountCents,
                        currency: record.currency,
                        status: record.status,
                        createdAt: new Date(record.createdAt),
                        updatedAt: now
                    }
                });
            }
        }
    }
    serializeTicket(ticket) {
        return {
            id: ticket.id,
            locationId: ticket.locationId,
            createdByUserId: ticket.createdByUserId,
            assignedToUserId: ticket.assignedToUserId,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            scheduledStartAt: ticket.scheduledStartAt?.toISOString() ?? null,
            scheduledEndAt: ticket.scheduledEndAt?.toISOString() ?? null,
            priority: ticket.priority,
            totalAmountCents: ticket.totalAmountCents,
            currency: ticket.currency,
            createdAt: ticket.createdAt.toISOString(),
            updatedAt: ticket.updatedAt.toISOString(),
            deletedAt: ticket.deletedAt?.toISOString() ?? null
        };
    }
    serializeComment(comment) {
        return {
            id: comment.id,
            ticketId: comment.ticketId,
            locationId: comment.locationId,
            authorUserId: comment.authorUserId,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString(),
            deletedAt: comment.deletedAt?.toISOString() ?? null
        };
    }
    serializeAttachment(attachment) {
        return {
            id: attachment.id,
            ticketId: attachment.ticketId,
            locationId: attachment.locationId,
            uploadedByUserId: attachment.uploadedByUserId,
            kind: attachment.kind,
            storageKey: attachment.storageKey,
            url: attachment.url,
            mimeType: attachment.mimeType,
            size: attachment.size,
            width: attachment.width,
            height: attachment.height,
            createdAt: attachment.createdAt.toISOString(),
            updatedAt: attachment.updatedAt.toISOString(),
            deletedAt: attachment.deletedAt?.toISOString() ?? null
        };
    }
    serializePayment(payment) {
        return {
            id: payment.id,
            ticketId: payment.ticketId,
            locationId: payment.locationId,
            provider: payment.provider,
            amountCents: payment.amountCents,
            currency: payment.currency,
            status: payment.status,
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString()
        };
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SyncService);
//# sourceMappingURL=sync.service.js.map