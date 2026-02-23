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
exports.PrivilegesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const shared_1 = require("@jtrack/shared");
const prisma_service_1 = require("../prisma/prisma.service");
const public_decorator_1 = require("../auth/public.decorator");
const require_privileges_decorator_1 = require("./require-privileges.decorator");
let PrivilegesGuard = class PrivilegesGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (isPublic) {
            return true;
        }
        const requiredPrivileges = this.reflector.getAllAndOverride(require_privileges_decorator_1.REQUIRE_PRIVILEGES_KEY, [
            context.getHandler(),
            context.getClass()
        ]) ?? [];
        if (requiredPrivileges.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        if (!request.user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        if (request.user.isAdmin) {
            return true;
        }
        if (!request.locationId) {
            throw new common_1.ForbiddenException('Location context is required');
        }
        let role = request.locationRole;
        if (!role) {
            const membership = await this.prisma.userLocation.findUnique({
                where: {
                    userId_locationId: {
                        userId: request.user.sub,
                        locationId: request.locationId
                    }
                }
            });
            if (!membership || membership.status !== 'active') {
                throw new common_1.ForbiddenException('No active membership found');
            }
            role = membership.role;
            request.locationRole = role;
        }
        const grantedPrivileges = new Set(shared_1.rolePrivileges[role]);
        const missingPrivileges = requiredPrivileges.filter((privilege) => !grantedPrivileges.has(privilege));
        if (missingPrivileges.length > 0) {
            throw new common_1.ForbiddenException(`Missing privileges: ${missingPrivileges.join(', ')}`);
        }
        return true;
    }
};
exports.PrivilegesGuard = PrivilegesGuard;
exports.PrivilegesGuard = PrivilegesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PrivilegesGuard);
//# sourceMappingURL=privileges.guard.js.map