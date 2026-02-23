import type { PresignedUpload, StorageProvider } from './storage-provider.interface';
export declare class S3StorageProvider implements StorageProvider {
    getPresignedUpload(_: {
        fileName: string;
        mimeType: string;
    }): Promise<PresignedUpload>;
    saveBase64(_: {
        storageKey: string;
        base64: string;
    }): Promise<{
        url: string;
        size: number;
    }>;
    getPublicUrl(storageKey: string): string;
}
