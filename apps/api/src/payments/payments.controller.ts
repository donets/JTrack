import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import {
  createPaymentRecordSchema,
  type CreatePaymentRecordInput,
  paymentStatusUpdateInputSchema,
  type UpdatePaymentStatusInput
} from '@jtrack/shared'
import { CurrentLocation } from '@/common/current-location.decorator'
import { ZodValidationPipe } from '@/common/zod-validation.pipe'
import { RequirePrivileges } from '@/rbac/require-privileges.decorator'
import { PaymentsService } from './payments.service'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePrivileges(['payments.read'])
  async list(@CurrentLocation() locationId: string, @Query('ticketId') ticketId?: string) {
    return this.paymentsService.list(locationId, ticketId)
  }

  @Post()
  @RequirePrivileges(['payments.write'])
  async create(
    @CurrentLocation() locationId: string,
    @Body(new ZodValidationPipe(createPaymentRecordSchema)) body: CreatePaymentRecordInput
  ) {
    return this.paymentsService.create(locationId, body)
  }

  @Patch(':id/status')
  @RequirePrivileges(['payments.write'])
  async updateStatus(
    @CurrentLocation() locationId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(paymentStatusUpdateInputSchema)) body: UpdatePaymentStatusInput
  ) {
    return this.paymentsService.updateStatus(locationId, id, body.status)
  }
}
