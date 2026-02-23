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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs_1 = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async login(input) {
        const user = await this.prisma.user.findUnique({ where: { email: input.email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordMatches = await (0, bcryptjs_1.compare)(input.password, user.passwordHash);
        if (!passwordMatches) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.createTokens({
            sub: user.id,
            email: user.email,
            isAdmin: user.isAdmin
        });
        await this.setRefreshToken(user.id, tokens.refreshToken);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: this.toUserResponse(user)
        };
    }
    async refresh(rawRefreshToken) {
        const payload = await this.jwtService.verifyAsync(rawRefreshToken, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET')
        });
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const tokenMatches = await (0, bcryptjs_1.compare)(rawRefreshToken, user.refreshTokenHash);
        if (!tokenMatches) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const tokens = await this.createTokens({
            sub: user.id,
            email: user.email,
            isAdmin: user.isAdmin
        });
        await this.setRefreshToken(user.id, tokens.refreshToken);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: this.toUserResponse(user)
        };
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: null }
        });
    }
    async me(userId) {
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
            throw new common_1.UnauthorizedException('User does not exist');
        }
        return this.toUserResponse(user);
    }
    getRefreshCookieOptions() {
        return {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/auth',
            maxAge: 1000 * 60 * 60 * 24 * 30
        };
    }
    async createTokens(payload) {
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
            expiresIn: (this.configService.get('JWT_ACCESS_TTL') ?? '15m')
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: (this.configService.get('JWT_REFRESH_TTL') ?? '30d')
        });
        return { accessToken, refreshToken };
    }
    async setRefreshToken(userId, refreshToken) {
        const refreshTokenHash = await (0, bcryptjs_1.hash)(refreshToken, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash }
        });
    }
    toUserResponse(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map