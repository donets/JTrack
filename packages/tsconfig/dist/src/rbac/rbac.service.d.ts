import { PrismaService } from '@/prisma/prisma.service';
export declare class RbacService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRoles(): Promise<{
        key: import("@prisma/client").$Enums.RoleKey;
        name: string;
        privileges: string[];
    }[]>;
    getPrivileges(): Promise<{
        key: string;
        description: string | null;
    }[]>;
}
