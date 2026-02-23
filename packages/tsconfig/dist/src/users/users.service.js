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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcryptjs_1 = require("bcryptjs");
const shared_1 = require("@jtrack/shared");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listByLocation(locationId) {
        const memberships = await this.prisma.userLocation.findMany({
            where: { locationId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        isAdmin: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return memberships.map((membership) => ({
            ...membership.user,
            role: membership.role,
            membershipStatus: membership.status,
            createdAt: membership.user.createdAt.toISOString(),
            updatedAt: membership.user.updatedAt.toISOString()
        }));
    }
    async create(data, locationId) {
        const input = shared_1.createUserSchema.parse(data);
        const passwordHash = await (0, bcryptjs_1.hash)(input.password ?? 'ChangeMe123!', 12);
        const user = await this.prisma.user.upsert({
            where: { email: input.email },
            update: {
                name: input.name,
                passwordHash
            },
            create: {
                email: input.email,
                name: input.name,
                passwordHash
            }
        });
        const targetLocationId = input.locationId ?? locationId;
        if (targetLocationId) {
            await this.prisma.userLocation.upsert({
                where: {
                    userId_locationId: {
                        userId: user.id,
                        locationId: targetLocationId
                    }
                },
                update: {
                    role: (input.role ?? 'Technician'),
                    status: 'active'
                },
                create: {
                    userId: user.id,
                    locationId: targetLocationId,
                    role: (input.role ?? 'Technician'),
                    status: 'active'
                }
            });
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
        };
    }
    async invite(data, locationId) {
        const input = shared_1.createUserSchema.parse(data);
        const passwordHash = await (0, bcryptjs_1.hash)(input.password ?? 'InviteOnly123!', 12);
        const user = await this.prisma.user.upsert({
            where: { email: input.email },
            update: {
                name: input.name
            },
            create: {
                email: input.email,
                name: input.name,
                passwordHash
            }
        });
        await this.prisma.userLocation.upsert({
            where: {
                userId_locationId: {
                    userId: user.id,
                    locationId
                }
            },
            update: {
                role: (input.role ?? 'Technician'),
                status: 'invited'
            },
            create: {
                userId: user.id,
                locationId,
                role: (input.role ?? 'Technician'),
                status: 'invited'
            }
        });
        return {
            ok: true,
            userId: user.id,
            status: 'invited'
        };
    }
    async update(userId, data) {
        const input = shared_1.updateUserSchema.parse(data);
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: input,
            select: {
                id: true,
                email: true,
                name: true,
                isAdmin: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return {
            ...user,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
        };
    }
    async getById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                isAdmin: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return null;
        }
        return {
            ...user,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
        };
    }
    async remove(userId) {
        await this.prisma.userLocation.deleteMany({ where: { userId } });
        await this.prisma.user.delete({ where: { id: userId } });
        return { ok: true };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map