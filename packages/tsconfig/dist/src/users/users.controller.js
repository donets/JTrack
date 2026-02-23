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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const require_privileges_decorator_1 = require("../rbac/require-privileges.decorator");
const current_location_decorator_1 = require("../common/current-location.decorator");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async list(locationId) {
        return this.usersService.listByLocation(locationId);
    }
    async create(body, locationId) {
        return this.usersService.create(body, locationId);
    }
    async invite(body, locationId) {
        return this.usersService.invite(body, locationId);
    }
    async getById(id) {
        return this.usersService.getById(id);
    }
    async update(id, body) {
        return this.usersService.update(id, body);
    }
    async remove(id) {
        return this.usersService.remove(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, require_privileges_decorator_1.RequirePrivileges)(['users.read']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_privileges_decorator_1.RequirePrivileges)(['users.manage']),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_location_decorator_1.CurrentLocation)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['users.manage']),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_location_decorator_1.CurrentLocation)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "invite", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['users.read']),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['users.manage']),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['users.manage']),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map