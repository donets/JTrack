import { Body, Controller, Post } from '@nestjs/common'
import {
  syncPullRequestSchema,
  type SyncPullRequest,
  syncPushRequestSchema,
  type SyncPushRequest
} from '@jtrack/shared'
import { CurrentLocation } from '@/common/current-location.decorator'
import { ZodValidationPipe } from '@/common/zod-validation.pipe'
import { RequirePrivileges } from '@/rbac/require-privileges.decorator'
import { SyncService } from './sync.service'

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('pull')
  @RequirePrivileges(['sync.run'])
  async pull(
    @CurrentLocation() locationId: string,
    @Body(new ZodValidationPipe(syncPullRequestSchema)) body: SyncPullRequest
  ) {
    return this.syncService.pull(body, locationId)
  }

  @Post('push')
  @RequirePrivileges(['sync.run'])
  async push(
    @CurrentLocation() locationId: string,
    @Body(new ZodValidationPipe(syncPushRequestSchema)) body: SyncPushRequest
  ) {
    return this.syncService.push(body, locationId)
  }
}
