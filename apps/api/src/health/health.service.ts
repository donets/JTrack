import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { HealthResponse } from '@jtrack/shared'
import { PrismaService } from '@/prisma/prisma.service'

const DEFAULT_API_VERSION = '1.0.0'

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async check(): Promise<HealthResponse> {
    const version = this.configService.get<string>('API_VERSION') ?? DEFAULT_API_VERSION

    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        database: 'down',
        version
      } satisfies HealthResponse)
    }

    return {
      status: 'ok',
      database: 'up',
      version
    }
  }
}
