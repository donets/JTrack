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
exports.LocationsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@jtrack/shared");
const prisma_service_1 = require("../prisma/prisma.service");
let LocationsService = class LocationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listForUser(user) {
        if (user.isAdmin) {
            const locations = await this.prisma.location.findMany({
                orderBy: { createdAt: 'desc' }
            });
            return locations.map((location) => ({
                id: location.id,
                name: location.name,
                timezone: location.timezone,
                address: location.address,
                role: 'Owner',
                membershipStatus: 'active',
                createdAt: location.createdAt.toISOString(),
                updatedAt: location.updatedAt.toISOString()
            }));
        }
        const memberships = await this.prisma.userLocation.findMany({
            where: { userId: user.sub },
            include: {
                location: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return memberships.map((membership) => ({
            id: membership.location.id,
            name: membership.location.name,
            timezone: membership.location.timezone,
            address: membership.location.address,
            role: membership.role,
            membershipStatus: membership.status,
            createdAt: membership.location.createdAt.toISOString(),
            updatedAt: membership.location.updatedAt.toISOString()
        }));
    }
    async create(user, data) {
        const input = shared_1.createLocationSchema.parse(data);
        return this.prisma.$transaction(async (tx) => {
            const location = await tx.location.create({
                data: {
                    name: input.name,
                    timezone: input.timezone,
                    address: input.address
                }
            });
            await tx.userLocation.upsert({
                where: {
                    userId_locationId: {
                        userId: user.sub,
                        locationId: location.id
                    }
                },
                update: {
                    role: 'Owner',
                    status: 'active'
                },
                create: {
                    userId: user.sub,
                    locationId: location.id,
                    role: 'Owner',
                    status: 'active'
                }
            });
            return {
                id: location.id,
                name: location.name,
                timezone: location.timezone,
                address: location.address,
                createdAt: location.createdAt.toISOString(),
                updatedAt: location.updatedAt.toISOString()
            };
        });
    }
    async update(user, locationId, data) {
        const input = shared_1.updateLocationSchema.parse(data);
        if (!user.isAdmin) {
            const membership = await this.prisma.userLocation.findUnique({
                where: {
                    userId_locationId: {
                        userId: user.sub,
                        locationId
                    }
                }
            });
            if (!membership || membership.role !== 'Owner') {
                throw new common_1.ForbiddenException('Only location owners can update this location');
            }
        }
        const location = await this.prisma.location.update({
            where: { id: locationId },
            data: input
        });
        return {
            id: location.id,
            name: location.name,
            timezone: location.timezone,
            address: location.address,
            createdAt: location.createdAt.toISOString(),
            updatedAt: location.updatedAt.toISOString()
        };
    }
    async remove(user, locationId) {
        if (!user.isAdmin) {
            const membership = await this.prisma.userLocation.findUnique({
                where: {
                    userId_locationId: {
                        userId: user.sub,
                        locationId
                    }
                }
            });
            if (!membership || membership.role !== 'Owner') {
                throw new common_1.ForbiddenException('Only location owners can delete this location');
            }
        }
        await this.prisma.location.delete({ where: { id: locationId } });
        return { ok: true };
    }
};
exports.LocationsService = LocationsService;
exports.LocationsService = LocationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LocationsService);
//# sourceMappingURL=locations.service.js.map