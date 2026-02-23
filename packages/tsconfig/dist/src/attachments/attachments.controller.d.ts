import type { JwtUser } from '@/common/types';
import { AttachmentsService } from './attachments.service';
export declare class AttachmentsController {
    private readonly attachmentsService;
    constructor(attachmentsService: AttachmentsService);
    presign(body: unknown): Promise<import("./storage/storage-provider.interface").PresignedUpload>;
    upload(storageKey: string, body: unknown): Promise<{
        url: string;
        size: number;
    }>;
    createMetadata(locationId: string, user: JwtUser, body: unknown): Promise<{
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
    remove(locationId: string, id: string): Promise<{
        ok: boolean;
    }>;
}
