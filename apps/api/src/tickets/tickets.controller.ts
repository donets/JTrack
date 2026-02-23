import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { CurrentLocation } from '@/common/current-location.decorator'
import { CurrentUser } from '@/common/current-user.decorator'
import type { JwtUser } from '@/common/types'
import { RequirePrivileges } from '@/rbac/require-privileges.decorator'
import { TicketsService } from './tickets.service'

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @RequirePrivileges(['tickets.read'])
  async list(
    @CurrentLocation() locationId: string,
    @Query('status') status?: string,
    @Query('assignedToUserId') assignedToUserId?: string
  ) {
    const filters: { status?: string; assignedToUserId?: string } = {}

    if (status) {
      filters.status = status
    }

    if (assignedToUserId) {
      filters.assignedToUserId = assignedToUserId
    }

    return this.ticketsService.list(locationId, filters)
  }

  @Get(':id')
  @RequirePrivileges(['tickets.read'])
  async getById(@CurrentLocation() locationId: string, @Param('id') id: string) {
    return this.ticketsService.getById(locationId, id)
  }

  @Post()
  @RequirePrivileges(['tickets.write'])
  async create(
    @CurrentLocation() locationId: string,
    @CurrentUser() user: JwtUser,
    @Body() body: unknown
  ) {
    return this.ticketsService.create(locationId, user.sub, body)
  }

  @Patch(':id')
  @RequirePrivileges(['tickets.write'])
  async update(
    @CurrentLocation() locationId: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.ticketsService.update(locationId, id, body)
  }

  @Patch(':id/status')
  @RequirePrivileges(['tickets.status.update'])
  async transitionStatus(
    @CurrentLocation() locationId: string,
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    return this.ticketsService.transitionStatus(locationId, id, body.status)
  }

  @Delete(':id')
  @RequirePrivileges(['tickets.write'])
  async remove(@CurrentLocation() locationId: string, @Param('id') id: string) {
    return this.ticketsService.remove(locationId, id)
  }
}
