export interface PresignedUpload {
    storageKey: string;
    uploadUrl: string;
    headers: Record<string, string>;
}
export interface StorageProvider {
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
export declare const STORAGE_PROVIDER = "STORAGE_PROVIDER";
