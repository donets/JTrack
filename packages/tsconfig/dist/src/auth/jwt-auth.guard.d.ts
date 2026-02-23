import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
export declare class JwtAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly jwtService;
    private readonly configService;
    private readonly prisma;
    constructor(reflector: Reflector, jwtService: JwtService, configService: ConfigService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
