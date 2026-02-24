import { ForbiddenException, type ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IS_PUBLIC_KEY } from '@/auth/public.decorator'
import { type AuthenticatedRequest } from '@/common/types'
import { PrivilegesGuard } from './privileges.guard'
import { REQUIRE_PRIVILEGES_KEY } from './require-privileges.decorator'

const createContext = (request: AuthenticatedRequest): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request
    })
  }) as never

describe('PrivilegesGuard', () => {
  let guard: PrivilegesGuard
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

    guard = new PrivilegesGuard(reflector as Reflector, prisma as never)
  })

  it('allows public routes and routes without required privileges', async () => {
    metadata.set(IS_PUBLIC_KEY, true)
    await expect(
      guard.canActivate(
        createContext({
          headers: {}
        } as AuthenticatedRequest)
      )
    ).resolves.toBe(true)

    metadata.delete(IS_PUBLIC_KEY)
    metadata.set(REQUIRE_PRIVILEGES_KEY, [])
    await expect(
      guard.canActivate(
        createContext({
          headers: {}
        } as AuthenticatedRequest)
      )
    ).resolves.toBe(true)
  })

  it('rejects missing auth and missing location context', async () => {
    metadata.set(REQUIRE_PRIVILEGES_KEY, ['tickets.read'])

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
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('allows admin users regardless of required privileges', async () => {
    metadata.set(REQUIRE_PRIVILEGES_KEY, ['users.manage'])

    await expect(
      guard.canActivate(
        createContext({
          user: {
            sub: 'admin-1',
            email: 'admin@jtrack.local',
            isAdmin: true
          },
          locationId: 'loc-1',
          headers: {}
        } as AuthenticatedRequest)
      )
    ).resolves.toBe(true)
  })

  it('loads location role from membership and allows granted privileges', async () => {
    metadata.set(REQUIRE_PRIVILEGES_KEY, ['tickets.read', 'sync.run'])
    prisma.userLocation.findUnique.mockResolvedValue({
      userId: 'manager-1',
      locationId: 'loc-1',
      role: 'Manager',
      status: 'active'
    })

    const request = {
      user: {
        sub: 'manager-1',
        email: 'manager@jtrack.local',
        isAdmin: false
      },
      locationId: 'loc-1',
      headers: {}
    } as AuthenticatedRequest

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true)
    expect(request.locationRole).toBe('Manager')
  })

  it('rejects requests when required privilege is missing', async () => {
    metadata.set(REQUIRE_PRIVILEGES_KEY, ['users.manage'])

    await expect(
      guard.canActivate(
        createContext({
          user: {
            sub: 'tech-1',
            email: 'tech@jtrack.local',
            isAdmin: false
          },
          locationId: 'loc-1',
          locationRole: 'Technician',
          headers: {}
        } as AuthenticatedRequest)
      )
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
