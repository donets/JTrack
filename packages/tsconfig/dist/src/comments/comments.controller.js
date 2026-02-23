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
exports.CommentsController = void 0;
const common_1 = require("@nestjs/common");
const current_location_decorator_1 = require("../common/current-location.decorator");
const current_user_decorator_1 = require("../common/current-user.decorator");
const require_privileges_decorator_1 = require("../rbac/require-privileges.decorator");
const comments_service_1 = require("./comments.service");
let CommentsController = class CommentsController {
    commentsService;
    constructor(commentsService) {
        this.commentsService = commentsService;
    }
    async list(locationId, ticketId) {
        return this.commentsService.list(locationId, ticketId);
    }
    async create(locationId, user, body) {
        return this.commentsService.create(locationId, user.sub, body);
    }
    async remove(locationId, id) {
        return this.commentsService.remove(locationId, id);
    }
};
exports.CommentsController = CommentsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_privileges_decorator_1.RequirePrivileges)(['comments.read']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, common_1.Query)('ticketId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_privileges_decorator_1.RequirePrivileges)(['comments.write']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['comments.write']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "remove", null);
exports.CommentsController = CommentsController = __decorate([
    (0, common_1.Controller)('comments'),
    __metadata("design:paramtypes", [comments_service_1.CommentsService])
], CommentsController);
//# sourceMappingURL=comments.controller.js.map