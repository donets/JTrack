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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@jtrack/shared");
const prisma_service_1 = require("../prisma/prisma.service");
let CommentsService = class CommentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(locationId, ticketId) {
        const comments = await this.prisma.ticketComment.findMany({
            where: {
                locationId,
                ticketId,
                deletedAt: null
            },
            orderBy: { createdAt: 'asc' }
        });
        return comments.map((comment) => ({
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString(),
            deletedAt: comment.deletedAt?.toISOString() ?? null
        }));
    }
    async create(locationId, authorUserId, data) {
        const input = shared_1.createCommentSchema.parse(data);
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
        const comment = await this.prisma.ticketComment.create({
            data: {
                locationId,
                ticketId: input.ticketId,
                authorUserId,
                body: input.body
            }
        });
        return {
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString(),
            deletedAt: comment.deletedAt?.toISOString() ?? null
        };
    }
    async remove(locationId, commentId) {
        const deleted = await this.prisma.ticketComment.updateMany({
            where: {
                id: commentId,
                locationId,
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        });
        if (deleted.count === 0) {
            throw new common_1.NotFoundException('Comment not found');
        }
        return { ok: true };
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map