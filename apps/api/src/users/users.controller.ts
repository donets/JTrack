import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { RequirePrivileges } from '@/rbac/require-privileges.decorator'
import { CurrentLocation } from '@/common/current-location.decorator'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePrivileges(['users.read'])
  async list(@CurrentLocation() locationId: string) {
    return this.usersService.listByLocation(locationId)
  }

  @Post()
  @RequirePrivileges(['users.manage'])
  async create(@Body() body: unknown, @CurrentLocation() locationId: string) {
    return this.usersService.create(body, locationId)
  }

  @Post('invite')
  @RequirePrivileges(['users.manage'])
  async invite(@Body() body: unknown, @CurrentLocation() locationId: string) {
    return this.usersService.invite(body, locationId)
  }

  @Get(':id')
  @RequirePrivileges(['users.read'])
  async getById(@Param('id') id: string) {
    return this.usersService.getById(id)
  }

  @Patch(':id')
  @RequirePrivileges(['users.manage'])
  async update(@Param('id') id: string, @Body() body: unknown) {
    return this.usersService.update(id, body)
  }

  @Delete(':id')
  @RequirePrivileges(['users.manage'])
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }
}
