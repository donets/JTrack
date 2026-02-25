import { ServiceUnavailableException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthService } from './health.service'

describe('HealthService', () => {
  let service: HealthService
  let prisma: { $queryRaw: ReturnType<typeof vi.fn> }
  let configService: { get: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    prisma = {
      $queryRaw: vi.fn()
    }

    configService = {
      get: vi.fn()
    }

    service = new HealthService(prisma as never, configService as never)
  })

  it('returns ok when database is reachable', async () => {
    prisma.$queryRaw.mockResolvedValue([{ one: 1 }])
    configService.get.mockReturnValue('2.3.4')

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
      version: '2.3.4'
    })
  })

  it('falls back to default API version when env value is missing', async () => {
    prisma.$queryRaw.mockResolvedValue([{ one: 1 }])
    configService.get.mockReturnValue(undefined)

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
      version: '1.0.0'
    })
  })

  it('throws 503 readiness payload when database is unavailable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db unavailable'))
    configService.get.mockReturnValue('1.2.3')

    try {
      await service.check()
      throw new Error('Expected check() to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException)
      expect((error as ServiceUnavailableException).getResponse()).toEqual({
        status: 'degraded',
        database: 'down',
        version: '1.2.3'
      })
    }
  })
})
