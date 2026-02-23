import { RbacService } from './rbac.service';
export declare class RbacController {
    private readonly rbacService;
    constructor(rbacService: RbacService);
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
