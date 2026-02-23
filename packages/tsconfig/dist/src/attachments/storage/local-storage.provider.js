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
exports.LocalStorageProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_crypto_1 = require("node:crypto");
let LocalStorageProvider = class LocalStorageProvider {
    uploadDir;
    constructor(configService) {
        this.uploadDir = configService.get('UPLOAD_DIR') ?? './uploads';
    }
    async getPresignedUpload(input) {
        const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageKey = `${Date.now()}-${(0, node_crypto_1.randomUUID)()}-${safeFileName}`;
        return {
            storageKey,
            uploadUrl: `/attachments/upload/${encodeURIComponent(storageKey)}`,
            headers: {
                'content-type': input.mimeType
            }
        };
    }
    async saveBase64(input) {
        const targetPath = (0, node_path_1.join)(this.uploadDir, input.storageKey);
        await (0, promises_1.mkdir)((0, node_path_1.dirname)(targetPath), { recursive: true });
        const buffer = Buffer.from(input.base64, 'base64');
        await (0, promises_1.writeFile)(targetPath, buffer);
        return {
            url: this.getPublicUrl(input.storageKey),
            size: buffer.byteLength
        };
    }
    getPublicUrl(storageKey) {
        return `/uploads/${storageKey}`;
    }
};
exports.LocalStorageProvider = LocalStorageProvider;
exports.LocalStorageProvider = LocalStorageProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LocalStorageProvider);
//# sourceMappingURL=local-storage.provider.js.map