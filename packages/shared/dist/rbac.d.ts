export declare const roleKeys: readonly ["Owner", "Manager", "Technician"];
export type RoleKey = (typeof roleKeys)[number];
export declare const privilegeKeys: readonly ["tickets.read", "tickets.write", "tickets.assign", "tickets.status.update", "dispatch.manage", "users.read", "users.manage", "locations.read", "locations.manage", "comments.read", "comments.write", "attachments.read", "attachments.write", "payments.read", "payments.write", "billing.manage", "sync.run"];
export type PrivilegeKey = (typeof privilegeKeys)[number];
export declare const rolePrivileges: Record<RoleKey, PrivilegeKey[]>;
//# sourceMappingURL=rbac.d.ts.map