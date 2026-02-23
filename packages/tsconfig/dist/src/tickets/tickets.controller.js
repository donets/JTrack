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
exports.TicketsController = void 0;
const common_1 = require("@nestjs/common");
const current_location_decorator_1 = require("../common/current-location.decorator");
const current_user_decorator_1 = require("../common/current-user.decorator");
const require_privileges_decorator_1 = require("../rbac/require-privileges.decorator");
const tickets_service_1 = require("./tickets.service");
let TicketsController = class TicketsController {
    ticketsService;
    constructor(ticketsService) {
        this.ticketsService = ticketsService;
    }
    async list(locationId, status, assignedToUserId) {
        const filters = {};
        if (status) {
            filters.status = status;
        }
        if (assignedToUserId) {
            filters.assignedToUserId = assignedToUserId;
        }
        return this.ticketsService.list(locationId, filters);
    }
    async getById(locationId, id) {
        return this.ticketsService.getById(locationId, id);
    }
    async create(locationId, user, body) {
        return this.ticketsService.create(locationId, user.sub, body);
    }
    async update(locationId, id, body) {
        return this.ticketsService.update(locationId, id, body);
    }
    async transitionStatus(locationId, id, body) {
        return this.ticketsService.transitionStatus(locationId, id, body.status);
    }
    async remove(locationId, id) {
        return this.ticketsService.remove(locationId, id);
    }
};
exports.TicketsController = TicketsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_privileges_decorator_1.RequirePrivileges)(['tickets.read']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('assignedToUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['tickets.read']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_privileges_decorator_1.RequirePrivileges)(['tickets.write']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['tickets.write']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['tickets.status.update']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "transitionStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_privileges_decorator_1.RequirePrivileges)(['tickets.write']),
    __param(0, (0, current_location_decorator_1.CurrentLocation)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "remove", null);
exports.TicketsController = TicketsController = __decorate([
    (0, common_1.Controller)('tickets'),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService])
], TicketsController);
//# sourceMappingURL=tickets.controller.js.map