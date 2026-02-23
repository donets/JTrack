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
exports.AttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const current_location_decorator_1 = require("../common/current-location.decorator");
const current_user_decorator_1 = require("../common/current-user.decorator");
const require_privileges_decorator_1 = require("../rbac/require-privileges.decorator");
const attachments_service_1 = require("./attachments.service");
let AttachmentsController = class AttachmentsController {
    attachmentsService;
    constructor(attachmentsService) {
        this.attachmentsService = attachmentsService;
    }
    async presign(body) {
        return this.attachmentsService.presign(body);
    }
    async upload(storageKey, body) {
        return this.attachmentsService.upload(storageKey, body);
    }
    async createMetadata(locationId, user, body) {
        return this.attachmentsService.createMetadata(locationId, user.sub, body);
    }
    async list(locationId, ticketId) {
        return this.attachmentsService.list(locationId, ticketId);
    }
    async remove(locationId, id) {
        return this.attachmentsService.remove(locationId, id);
    }
};
exports.AttachmentsController = AttachmentsController;
__decorate([
    (0, common_1.Post)('presign'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['attachments.write']),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "presign", null);
__decorate([
    (0, common_1.Put)('upload/:storageKey'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['attachments.write']),
    __param(0, (0, common_1.Param)('storageKey')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('metadata'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['attachments.write']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "createMetadata", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_privileges_decorator_1.RequirePrivileges)(['attachments.read']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, common_1.Query)('ticketId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['attachments.write']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "remove", null);
exports.AttachmentsController = AttachmentsController = __decorate([
    (0, common_1.Controller)('attachments'),
    __metadata("design:paramtypes", [attachments_service_1.AttachmentsService])
], AttachmentsController);
//# sourceMappingURL=attachments.controller.js.map