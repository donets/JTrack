import type { PrivilegeKey } from '@jtrack/shared';
export declare const REQUIRE_PRIVILEGES_KEY = "requiredPrivileges";
export declare const RequirePrivileges: (privileges: PrivilegeKey[]) => import("@nestjs/common").CustomDecorator<string>;
