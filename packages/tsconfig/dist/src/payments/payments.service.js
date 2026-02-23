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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@jtrack/shared");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentsService = class PaymentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(locationId, ticketId) {
        const payments = await this.prisma.paymentRecord.findMany({
            where: {
                locationId,
                ticketId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return payments.map((payment) => ({
            ...payment,
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString()
        }));
    }
    async create(locationId, data) {
        const input = shared_1.createPaymentRecordSchema.parse(data);
        const ticket = await this.prisma.ticket.findFirst({
            where: {
                id: input.ticketId,
                locationId,
                deletedAt: null
            },
            select: { id: true }
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        const payment = await this.prisma.paymentRecord.create({
            data: {
                locationId,
                ticketId: input.ticketId,
                provider: input.provider,
                amountCents: input.amountCents,
                currency: input.currency,
                status: input.status
            }
        });
        return {
            ...payment,
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString()
        };
    }
    async updateStatus(locationId, paymentId, status) {
        const nextStatus = shared_1.paymentStatusSchema.parse(status);
        const payment = await this.prisma.paymentRecord.updateMany({
            where: {
                id: paymentId,
                locationId
            },
            data: {
                status: nextStatus
            }
        });
        if (payment.count === 0) {
            throw new common_1.NotFoundException('Payment record not found');
        }
        const updated = await this.prisma.paymentRecord.findUnique({
            where: { id: paymentId }
        });
        if (!updated) {
            throw new common_1.NotFoundException('Payment record not found');
        }
        return {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString()
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map