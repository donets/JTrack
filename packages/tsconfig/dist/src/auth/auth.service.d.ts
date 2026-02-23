import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import type { LoginInput } from '@jtrack/shared';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    login(input: LoginInput): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            isAdmin: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    refresh(rawRefreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            isAdmin: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    logout(userId: string): Promise<void>;
    me(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    getRefreshCookieOptions(): {
        httpOnly: boolean;
        sameSite: "lax";
        secure: boolean;
        path: string;
        maxAge: number;
    };
    private createTokens;
    private setRefreshToken;
    private toUserResponse;
}
