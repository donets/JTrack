import { PrismaService } from '@/prisma/prisma.service';
import { type StorageProvider } from './storage/storage-provider.interface';
export declare class AttachmentsService {
    private readonly prisma;
    private readonly storageProvider;
    constructor(prisma: PrismaService, storageProvider: StorageProvider);
    presign(data: unknown): Promise<import("./storage/storage-provider.interface").PresignedUpload>;
    upload(storageKey: string, data: unknown): Promise<{
        url: string;
        size: number;
    }>;
    createMetadata(locationId: string, uploadedByUserId: string, data: unknown): Promise<{
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        id: string;
        locationId: string;
        ticketId: string;
        uploadedByUserId: string;
        kind: import("@prisma/client").$Enums.AttachmentKind;
        storageKey: string;
        url: string;
        mimeType: string;
        size: number;
        width: number | null;
        height: number | null;
    }>;
    list(locationId: string, ticketId: string): Promise<{
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        id: string;
        locationId: string;
        ticketId: string;
        uploadedByUserId: string;
        kind: import("@prisma/client").$Enums.AttachmentKind;
        storageKey: string;
        url: string;
        mimeType: string;
        size: number;
        width: number | null;
        height: number | null;
    }[]>;
    remove(locationId: string, attachmentId: string): Promise<{
        ok: boolean;
    }>;
}
