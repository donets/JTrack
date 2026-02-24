import { Controller, Get } from '@nestjs/common'
import type { HealthResponse } from '@jtrack/shared'
import { Public } from '@/auth/public.decorator'
import { HealthService } from './health.service'

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  async check(): Promise<HealthResponse> {
    return this.healthService.check()
  }
}
