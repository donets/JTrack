import type { JwtUser } from '@/common/types';
import { PrismaService } from '@/prisma/prisma.service';
export declare class LocationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listForUser(user: JwtUser): Promise<{
        id: string;
        name: string;
        timezone: string;
        address: string | null;
        role: string;
        membershipStatus: string;
        createdAt: string;
        updatedAt: string;
    }[]>;
    create(user: JwtUser, data: unknown): Promise<{
        id: string;
        name: string;
        timezone: string;
        address: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    update(user: JwtUser, locationId: string, data: unknown): Promise<{
        id: string;
        name: string;
        timezone: string;
        address: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    remove(user: JwtUser, locationId: string): Promise<{
        ok: boolean;
    }>;
}
