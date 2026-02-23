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
exports.LocationGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../prisma/prisma.service");
const public_decorator_1 = require("../auth/public.decorator");
const skip_location_decorator_1 = require("./skip-location.decorator");
let LocationGuard = class LocationGuard {
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
        const skipLocation = this.reflector.getAllAndOverride(skip_location_decorator_1.SKIP_LOCATION_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (isPublic || skipLocation) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        if (!request.user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        const headerValue = request.headers['x-location-id'];
        const locationId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
        if (!locationId) {
            throw new common_1.BadRequestException('Missing x-location-id header');
        }
        request.locationId = locationId;
        if (request.user.isAdmin) {
            return true;
        }
        const membership = await this.prisma.userLocation.findUnique({
            where: {
                userId_locationId: {
                    userId: request.user.sub,
                    locationId
                }
            }
        });
        if (!membership || membership.status !== 'active') {
            throw new common_1.ForbiddenException('User is not a member of this location');
        }
        request.locationRole = membership.role;
        return true;
    }
};
exports.LocationGuard = LocationGuard;
exports.LocationGuard = LocationGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], LocationGuard);
//# sourceMappingURL=location.guard.js.map