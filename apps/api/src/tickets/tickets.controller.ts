import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common'
import {
  createTicketSchema,
  type CreateTicketInput,
  ticketListQuerySchema,
  ticketStatusUpdateInputSchema,
  type TicketListQuery,
  type UpdateTicketStatusInput,
  updateTicketSchema,
  type UpdateTicketInput
} from '@jtrack/shared'
import { CurrentLocation } from '@/common/current-location.decorator'
import { CurrentUser } from '@/common/current-user.decorator'
import type { JwtUser } from '@/common/types'
import { ZodValidationPipe } from '@/common/zod-validation.pipe'
import { RequirePrivileges } from '@/rbac/require-privileges.decorator'
import { TicketsService } from './tickets.service'

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @RequirePrivileges(['tickets.read'])
  async list(
    @CurrentLocation() locationId: string,
    @Query(new ZodValidationPipe(ticketListQuerySchema)) filters: TicketListQuery
  ) {
    return this.ticketsService.list(locationId, filters)
  }

  @Get(':id')
  @RequirePrivileges(['tickets.read'])
  async getById(@CurrentLocation() locationId: string, @Param('id') id: string) {
    return this.ticketsService.getById(locationId, id)
  }

  @Post()
  @RequirePrivileges(['tickets.write'])
  @UsePipes(new ZodValidationPipe(createTicketSchema))
  async create(
    @CurrentLocation() locationId: string,
    @CurrentUser() user: JwtUser,
    @Body() body: CreateTicketInput
  ) {
    return this.ticketsService.create(locationId, user.sub, body)
  }

  @Patch(':id')
  @RequirePrivileges(['tickets.write'])
  @UsePipes(new ZodValidationPipe(updateTicketSchema))
  async update(
    @CurrentLocation() locationId: string,
    @Param('id') id: string,
    @Body() body: UpdateTicketInput
  ) {
    return this.ticketsService.update(locationId, id, body)
  }

  @Patch(':id/status')
  @RequirePrivileges(['tickets.status.update'])
  @UsePipes(new ZodValidationPipe(ticketStatusUpdateInputSchema))
  async transitionStatus(
    @CurrentLocation() locationId: string,
    @Param('id') id: string,
    @Body() body: UpdateTicketStatusInput
  ) {
    return this.ticketsService.transitionStatus(locationId, id, body.status)
  }

  @Delete(':id')
  @RequirePrivileges(['tickets.write'])
  async remove(@CurrentLocation() locationId: string, @Param('id') id: string) {
    return this.ticketsService.remove(locationId, id)
  }
}
