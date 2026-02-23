import { PrismaService } from '@/prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listByLocation(locationId: string): Promise<{
        role: import("@prisma/client").$Enums.RoleKey;
        membershipStatus: import("@prisma/client").$Enums.MembershipStatus;
        createdAt: string;
        updatedAt: string;
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    }[]>;
    create(data: unknown, locationId?: string): Promise<{
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    invite(data: unknown, locationId: string): Promise<{
        ok: boolean;
        userId: string;
        status: string;
    }>;
    update(userId: string, data: unknown): Promise<{
        createdAt: string;
        updatedAt: string;
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    }>;
    getById(userId: string): Promise<{
        createdAt: string;
        updatedAt: string;
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    } | null>;
    remove(userId: string): Promise<{
        ok: boolean;
    }>;
}
