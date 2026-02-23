import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    list(locationId: string): Promise<{
        role: import("@prisma/client").$Enums.RoleKey;
        membershipStatus: import("@prisma/client").$Enums.MembershipStatus;
        createdAt: string;
        updatedAt: string;
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    }[]>;
    create(body: unknown, locationId: string): Promise<{
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    invite(body: unknown, locationId: string): Promise<{
        ok: boolean;
        userId: string;
        status: string;
    }>;
    getById(id: string): Promise<{
        createdAt: string;
        updatedAt: string;
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    } | null>;
    update(id: string, body: unknown): Promise<{
        createdAt: string;
        updatedAt: string;
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
