import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { CurrentUser } from '@/common/current-user.decorator'
import type { JwtUser } from '@/common/types'
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
  async create(@CurrentUser() user: JwtUser, @Body() body: unknown) {
    return this.locationsService.create(user, body)
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id') locationId: string,
    @Body() body: unknown
  ) {
    return this.locationsService.update(user, locationId, body)
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtUser, @Param('id') locationId: string) {
    return this.locationsService.remove(user, locationId)
  }
}
