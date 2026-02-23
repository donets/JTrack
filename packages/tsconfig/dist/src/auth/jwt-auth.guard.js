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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../prisma/prisma.service");
const public_decorator_1 = require("./public.decorator");
let JwtAuthGuard = class JwtAuthGuard {
    reflector;
    jwtService;
    configService;
    prisma;
    constructor(reflector, jwtService, configService, prisma) {
        this.reflector = reflector;
        this.jwtService = jwtService;
        this.configService = configService;
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
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing access token');
        }
        const token = authHeader.slice('Bearer '.length);
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.getOrThrow('JWT_ACCESS_SECRET')
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, email: true, isAdmin: true }
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User does not exist');
            }
            request.user = {
                sub: user.id,
                email: user.email,
                isAdmin: user.isAdmin
            };
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid access token');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map