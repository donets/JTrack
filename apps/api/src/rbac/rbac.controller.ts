import { Controller, Get } from '@nestjs/common'
import { RequirePrivileges } from './require-privileges.decorator'
import { RbacService } from './rbac.service'

@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @RequirePrivileges(['users.read'])
  async getRoles() {
    return this.rbacService.getRoles()
  }

  @Get('privileges')
  @RequirePrivileges(['users.read'])
  async getPrivileges() {
    return this.rbacService.getPrivileges()
  }
}
