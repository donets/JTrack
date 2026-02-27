import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import {
  createUserSchema,
  type CreateUserInput,
  updateUserSchema,
  type UpdateUserInput
} from '@jtrack/shared'
import { RequirePrivileges } from '@/rbac/require-privileges.decorator'
import { CurrentLocation } from '@/common/current-location.decorator'
import { ZodValidationPipe } from '@/common/zod-validation.pipe'
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
  async create(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
    @CurrentLocation() locationId: string
  ) {
    return this.usersService.create(body, locationId)
  }

  @Post('invite')
  @RequirePrivileges(['users.manage'])
  async invite(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
    @CurrentLocation() locationId: string
  ) {
    return this.usersService.invite(body, locationId)
  }

  @Get(':id')
  @RequirePrivileges(['users.read'])
  async getById(@Param('id') id: string) {
    return this.usersService.getById(id)
  }

  @Patch(':id')
  @RequirePrivileges(['users.manage'])
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserInput,
    @CurrentLocation() locationId: string
  ) {
    return this.usersService.update(id, body, locationId)
  }

  @Delete(':id')
  @RequirePrivileges(['users.manage'])
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }
}
