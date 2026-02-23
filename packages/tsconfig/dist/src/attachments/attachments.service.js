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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@jtrack/shared");
const zod_1 = require("zod");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_provider_interface_1 = require("./storage/storage-provider.interface");
const presignInputSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1),
    mimeType: zod_1.z.string().min(1)
});
const uploadInputSchema = zod_1.z.object({
    base64: zod_1.z.string().min(1)
});
let AttachmentsService = class AttachmentsService {
    prisma;
    storageProvider;
    constructor(prisma, storageProvider) {
        this.prisma = prisma;
        this.storageProvider = storageProvider;
    }
    async presign(data) {
        const input = presignInputSchema.parse(data);
        return this.storageProvider.getPresignedUpload(input);
    }
    async upload(storageKey, data) {
        const input = uploadInputSchema.parse(data);
        return this.storageProvider.saveBase64({
            storageKey,
            base64: input.base64
        });
    }
    async createMetadata(locationId, uploadedByUserId, data) {
        const input = shared_1.createAttachmentMetadataSchema.parse(data);
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
        const attachment = await this.prisma.ticketAttachment.create({
            data: {
                locationId,
                ticketId: input.ticketId,
                uploadedByUserId,
                kind: input.kind,
                storageKey: input.storageKey,
                url: input.url,
                mimeType: input.mimeType,
                size: input.size,
                width: input.width,
                height: input.height
            }
        });
        return {
            ...attachment,
            createdAt: attachment.createdAt.toISOString(),
            updatedAt: attachment.updatedAt.toISOString(),
            deletedAt: attachment.deletedAt?.toISOString() ?? null
        };
    }
    async list(locationId, ticketId) {
        const attachments = await this.prisma.ticketAttachment.findMany({
            where: {
                locationId,
                ticketId,
                deletedAt: null
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return attachments.map((attachment) => ({
            ...attachment,
            createdAt: attachment.createdAt.toISOString(),
            updatedAt: attachment.updatedAt.toISOString(),
            deletedAt: attachment.deletedAt?.toISOString() ?? null
        }));
    }
    async remove(locationId, attachmentId) {
        const removed = await this.prisma.ticketAttachment.updateMany({
            where: {
                id: attachmentId,
                locationId,
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        });
        if (removed.count === 0) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        return { ok: true };
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(storage_provider_interface_1.STORAGE_PROVIDER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map