import type { Request, Response } from 'express';
import type { JwtUser } from '@/common/types';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        email: string;
        password: string;
    }, response: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            isAdmin: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    refresh(request: Request, response: Response, body: {
        refreshToken?: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            isAdmin: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    logout(user: JwtUser, response: Response): Promise<{
        ok: boolean;
    }>;
    me(user: JwtUser): Promise<{
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
}
