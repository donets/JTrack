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
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@jtrack/shared");
const prisma_service_1 = require("../prisma/prisma.service");
let TicketsService = class TicketsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(locationId, filters) {
        const tickets = await this.prisma.ticket.findMany({
            where: {
                locationId,
                deletedAt: null,
                status: filters.status,
                assignedToUserId: filters.assignedToUserId
            },
            orderBy: { updatedAt: 'desc' }
        });
        return tickets.map((ticket) => this.serialize(ticket));
    }
    async getById(locationId, ticketId) {
        const ticket = await this.prisma.ticket.findFirst({
            where: {
                id: ticketId,
                locationId,
                deletedAt: null
            },
            include: {
                comments: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'asc' }
                },
                attachments: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'desc' }
                },
                paymentRecords: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        return {
            ...this.serialize(ticket),
            comments: ticket.comments.map((comment) => ({
                ...comment,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString(),
                deletedAt: comment.deletedAt?.toISOString() ?? null
            })),
            attachments: ticket.attachments.map((attachment) => ({
                ...attachment,
                createdAt: attachment.createdAt.toISOString(),
                updatedAt: attachment.updatedAt.toISOString(),
                deletedAt: attachment.deletedAt?.toISOString() ?? null
            })),
            paymentRecords: ticket.paymentRecords.map((payment) => ({
                ...payment,
                createdAt: payment.createdAt.toISOString(),
                updatedAt: payment.updatedAt.toISOString()
            }))
        };
    }
    async create(locationId, createdByUserId, data) {
        const input = shared_1.createTicketSchema.parse(data);
        const ticket = await this.prisma.ticket.create({
            data: {
                locationId,
                createdByUserId,
                assignedToUserId: input.assignedToUserId,
                title: input.title,
                description: input.description,
                scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : null,
                scheduledEndAt: input.scheduledEndAt ? new Date(input.scheduledEndAt) : null,
                priority: input.priority,
                totalAmountCents: input.totalAmountCents,
                currency: input.currency
            }
        });
        return this.serialize(ticket);
    }
    async update(locationId, ticketId, data) {
        const input = shared_1.updateTicketSchema.parse(data);
        const ticket = await this.prisma.ticket.updateMany({
            where: {
                id: ticketId,
                locationId,
                deletedAt: null
            },
            data: {
                title: input.title,
                description: input.description,
                assignedToUserId: input.assignedToUserId,
                status: input.status,
                scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : undefined,
                scheduledEndAt: input.scheduledEndAt ? new Date(input.scheduledEndAt) : undefined,
                priority: input.priority,
                totalAmountCents: input.totalAmountCents,
                currency: input.currency
            }
        });
        if (ticket.count === 0) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        return this.getById(locationId, ticketId);
    }
    async transitionStatus(locationId, ticketId, status) {
        const nextStatus = shared_1.ticketStatusSchema.parse(status);
        const updated = await this.prisma.ticket.updateMany({
            where: {
                id: ticketId,
                locationId,
                deletedAt: null
            },
            data: {
                status: nextStatus
            }
        });
        if (updated.count === 0) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        return this.getById(locationId, ticketId);
    }
    async remove(locationId, ticketId) {
        const deleted = await this.prisma.ticket.updateMany({
            where: {
                id: ticketId,
                locationId,
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        });
        if (deleted.count === 0) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        return { ok: true };
    }
    serialize(ticket) {
        return {
            ...ticket,
            scheduledStartAt: ticket.scheduledStartAt?.toISOString() ?? null,
            scheduledEndAt: ticket.scheduledEndAt?.toISOString() ?? null,
            createdAt: ticket.createdAt.toISOString(),
            updatedAt: ticket.updatedAt.toISOString(),
            deletedAt: ticket.deletedAt?.toISOString() ?? null
        };
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map