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
exports.RbacController = void 0;
const common_1 = require("@nestjs/common");
const require_privileges_decorator_1 = require("./require-privileges.decorator");
const rbac_service_1 = require("./rbac.service");
let RbacController = class RbacController {
    rbacService;
    constructor(rbacService) {
        this.rbacService = rbacService;
    }
    async getRoles() {
        return this.rbacService.getRoles();
    }
    async getPrivileges() {
        return this.rbacService.getPrivileges();
    }
};
exports.RbacController = RbacController;
__decorate([
    (0, common_1.Get)('roles'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['users.read']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Get)('privileges'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['users.read']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "getPrivileges", null);
exports.RbacController = RbacController = __decorate([
    (0, common_1.Controller)('rbac'),
    __metadata("design:paramtypes", [rbac_service_1.RbacService])
], RbacController);
//# sourceMappingURL=rbac.controller.js.map