import { Body, Controller, Post } from '@nestjs/common'
import { CurrentLocation } from '@/common/current-location.decorator'
import { RequirePrivileges } from '@/rbac/require-privileges.decorator'
import { SyncService } from './sync.service'

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('pull')
  @RequirePrivileges(['sync.run'])
  async pull(@CurrentLocation() locationId: string, @Body() body: unknown) {
    return this.syncService.pull(body, locationId)
  }

  @Post('push')
  @RequirePrivileges(['sync.run'])
  async push(@CurrentLocation() locationId: string, @Body() body: unknown) {
    return this.syncService.push(body, locationId)
  }
}
