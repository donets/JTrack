import { Body, Controller, Delete, Get, Param, Post, Query, UsePipes } from '@nestjs/common'
import { createCommentSchema, type CreateCommentInput } from '@jtrack/shared'
import { CurrentLocation } from '@/common/current-location.decorator'
import { CurrentUser } from '@/common/current-user.decorator'
import type { JwtUser } from '@/common/types'
import { ZodValidationPipe } from '@/common/zod-validation.pipe'
import { RequirePrivileges } from '@/rbac/require-privileges.decorator'
import { CommentsService } from './comments.service'

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @RequirePrivileges(['comments.read'])
  async list(@CurrentLocation() locationId: string, @Query('ticketId') ticketId: string) {
    return this.commentsService.list(locationId, ticketId)
  }

  @Post()
  @RequirePrivileges(['comments.write'])
  @UsePipes(new ZodValidationPipe(createCommentSchema))
  async create(
    @CurrentLocation() locationId: string,
    @CurrentUser() user: JwtUser,
    @Body() body: CreateCommentInput
  ) {
    return this.commentsService.create(locationId, user.sub, body)
  }

  @Delete(':id')
  @RequirePrivileges(['comments.write'])
  async remove(@CurrentLocation() locationId: string, @Param('id') id: string) {
    return this.commentsService.remove(locationId, id)
  }
}
