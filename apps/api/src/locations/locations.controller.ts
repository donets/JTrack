import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes } from '@nestjs/common'
import {
  createLocationSchema,
  type CreateLocationInput,
  updateLocationSchema,
  type UpdateLocationInput
} from '@jtrack/shared'
import { CurrentUser } from '@/common/current-user.decorator'
import type { JwtUser } from '@/common/types'
import { ZodValidationPipe } from '@/common/zod-validation.pipe'
import { SkipLocationGuard } from '@/rbac/skip-location.decorator'
import { LocationsService } from './locations.service'

@SkipLocationGuard()
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async list(@CurrentUser() user: JwtUser) {
    return this.locationsService.listForUser(user)
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createLocationSchema))
  async create(@CurrentUser() user: JwtUser, @Body() body: CreateLocationInput) {
    return this.locationsService.create(user, body)
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateLocationSchema))
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id') locationId: string,
    @Body() body: UpdateLocationInput
  ) {
    return this.locationsService.update(user, locationId, body)
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtUser, @Param('id') locationId: string) {
    return this.locationsService.remove(user, locationId)
  }
}
