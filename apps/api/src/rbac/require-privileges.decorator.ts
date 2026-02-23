import { SetMetadata } from '@nestjs/common'
import type { PrivilegeKey } from '@jtrack/shared'

export const REQUIRE_PRIVILEGES_KEY = 'requiredPrivileges'

export const RequirePrivileges = (privileges: PrivilegeKey[]) =>
  SetMetadata(REQUIRE_PRIVILEGES_KEY, privileges)
