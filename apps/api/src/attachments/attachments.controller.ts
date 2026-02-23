import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { CurrentLocation } from '@/common/current-location.decorator'
import { CurrentUser } from '@/common/current-user.decorator'
import type { JwtUser } from '@/common/types'
import { RequirePrivileges } from '@/rbac/require-privileges.decorator'
import { AttachmentsService } from './attachments.service'

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('presign')
  @RequirePrivileges(['attachments.write'])
  async presign(@Body() body: unknown) {
    return this.attachmentsService.presign(body)
  }

  @Put('upload/:storageKey')
  @RequirePrivileges(['attachments.write'])
  async upload(@Param('storageKey') storageKey: string, @Body() body: unknown) {
    return this.attachmentsService.upload(storageKey, body)
  }

  @Post('metadata')
  @RequirePrivileges(['attachments.write'])
  async createMetadata(
    @CurrentLocation() locationId: string,
    @CurrentUser() user: JwtUser,
    @Body() body: unknown
  ) {
    return this.attachmentsService.createMetadata(locationId, user.sub, body)
  }

  @Get()
  @RequirePrivileges(['attachments.read'])
  async list(@CurrentLocation() locationId: string, @Query('ticketId') ticketId: string) {
    return this.attachmentsService.list(locationId, ticketId)
  }

  @Delete(':id')
  @RequirePrivileges(['attachments.write'])
  async remove(@CurrentLocation() locationId: string, @Param('id') id: string) {
    return this.attachmentsService.remove(locationId, id)
  }
}
