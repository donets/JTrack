import {
  BadRequestException,
  ForbiddenException,
  type ExecutionContext
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IS_PUBLIC_KEY } from '@/auth/public.decorator'
import { type AuthenticatedRequest } from '@/common/types'
import { LocationGuard } from './location.guard'
import { SKIP_LOCATION_KEY } from './skip-location.decorator'

const createContext = (request: AuthenticatedRequest): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request
    })
  }) as never

describe('LocationGuard', () => {
  let guard: LocationGuard
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> }
  let prisma: { userLocation: { findUnique: ReturnType<typeof vi.fn> } }
  let metadata: Map<string, unknown>

  beforeEach(() => {
    metadata = new Map()
    reflector = {
      getAllAndOverride: vi.fn((key: string) => metadata.get(key))
    }
    prisma = {
      userLocation: {
        findUnique: vi.fn()
      }
    }

    guard = new LocationGuard(reflector as Reflector, prisma as never)
  })

  it('allows access when route is public or skip-location', async () => {
    const request = {
      headers: {}
    } as AuthenticatedRequest

    metadata.set(IS_PUBLIC_KEY, true)
    await expect(guard.canActivate(createContext(request))).resolves.toBe(true)

    metadata.delete(IS_PUBLIC_KEY)
    metadata.set(SKIP_LOCATION_KEY, true)
    await expect(guard.canActivate(createContext(request))).resolves.toBe(true)
  })

  it('rejects unauthenticated request and missing location header', async () => {
    await expect(
      guard.canActivate(
        createContext({
          headers: {}
        } as AuthenticatedRequest)
      )
    ).rejects.toBeInstanceOf(ForbiddenException)

    await expect(
      guard.canActivate(
        createContext({
          user: {
            sub: 'user-1',
            email: 'tech@jtrack.local',
            isAdmin: false
          },
          headers: {}
        } as AuthenticatedRequest)
      )
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('allows admins without membership lookup', async () => {
    const request = {
      user: {
        sub: 'admin-1',
        email: 'admin@jtrack.local',
        isAdmin: true
      },
      headers: {
        'x-location-id': 'loc-1'
      }
    } as unknown as AuthenticatedRequest

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true)
    expect(request.locationId).toBe('loc-1')
    expect(prisma.userLocation.findUnique).not.toHaveBeenCalled()
  })

  it('loads active membership role for non-admin users', async () => {
    const request = {
      user: {
        sub: 'tech-1',
        email: 'tech@jtrack.local',
        isAdmin: false
      },
      headers: {
        'x-location-id': 'loc-1'
      }
    } as unknown as AuthenticatedRequest

    prisma.userLocation.findUnique.mockResolvedValue({
      userId: 'tech-1',
      locationId: 'loc-1',
      role: 'Technician',
      status: 'active'
    })

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true)
    expect(request.locationRole).toBe('Technician')
  })

  it('rejects users without active membership', async () => {
    prisma.userLocation.findUnique.mockResolvedValue({
      userId: 'tech-1',
      locationId: 'loc-1',
      role: 'Technician',
      status: 'suspended'
    })

    await expect(
      guard.canActivate(
        createContext({
          user: {
            sub: 'tech-1',
            email: 'tech@jtrack.local',
            isAdmin: false
          },
          headers: {
            'x-location-id': 'loc-1'
          }
        } as unknown as AuthenticatedRequest)
      )
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
