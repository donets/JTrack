import { ConfigService } from '@nestjs/config';
import type { PresignedUpload, StorageProvider } from './storage-provider.interface';
export declare class LocalStorageProvider implements StorageProvider {
    private readonly uploadDir;
    constructor(configService: ConfigService);
    getPresignedUpload(input: {
        fileName: string;
        mimeType: string;
    }): Promise<PresignedUpload>;
    saveBase64(input: {
        storageKey: string;
        base64: string;
    }): Promise<{
        url: string;
        size: number;
    }>;
    getPublicUrl(storageKey: string): string;
}
