import { UnauthorizedException } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from './auth.service'

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn()
}))

const compareMock = vi.mocked(compare)
const hashMock = vi.mocked(hash)

describe('AuthService', () => {
  let service: AuthService
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
    }
    userLocation: {
      updateMany: ReturnType<typeof vi.fn>
    }
    $transaction: ReturnType<typeof vi.fn>
  }
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>
    verifyAsync: ReturnType<typeof vi.fn>
  }
  let configService: {
    getOrThrow: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      userLocation: {
        updateMany: vi.fn()
      },
      $transaction: vi.fn()
    }

    jwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn()
    }

    configService = {
      getOrThrow: vi.fn((key: string) => `${key}-secret`),
      get: vi.fn()
    }

    compareMock.mockReset()
    hashMock.mockReset()

    service = new AuthService(prisma as never, jwtService as never, configService as never)

    prisma.$transaction.mockImplementation(
      async (
        callback: (tx: {
          user: { update: typeof prisma.user.update }
          userLocation: { updateMany: typeof prisma.userLocation.updateMany }
        }) => Promise<unknown>
      ) =>
        callback({
          user: {
            update: prisma.user.update
          },
          userLocation: {
            updateMany: prisma.userLocation.updateMany
          }
        })
    )
  })

  it('throws when login user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    await expect(
      service.login({
        email: 'missing@jtrack.local',
        password: 'password123'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException)

    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('returns tokens and persists refresh hash on login', async () => {
    const now = new Date('2026-02-24T09:00:00.000Z')
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'tech@jtrack.local',
      name: 'Tech',
      isAdmin: false,
      passwordHash: 'stored-password-hash',
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now
    })
    compareMock.mockResolvedValue(true)
    jwtService.signAsync.mockResolvedValueOnce('access-1').mockResolvedValueOnce('refresh-1')
    hashMock.mockResolvedValue('refresh-hash-1')
    prisma.user.update.mockResolvedValue({})

    const result = await service.login({
      email: 'tech@jtrack.local',
      password: 'password123'
    })

    expect(result).toEqual({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      user: {
        id: 'user-1',
        email: 'tech@jtrack.local',
        name: 'Tech',
        isAdmin: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { refreshTokenHash: 'refresh-hash-1' }
    })
  })

  it('refresh rejects invalid refresh token hashes', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' })
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'tech@jtrack.local',
      name: 'Tech',
      isAdmin: false,
      passwordHash: 'stored-password-hash',
      refreshTokenHash: 'stored-refresh-hash',
      createdAt: new Date('2026-02-24T09:00:00.000Z'),
      updatedAt: new Date('2026-02-24T09:00:00.000Z')
    })
    compareMock.mockResolvedValue(false)

    await expect(service.refresh('refresh-raw-token')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('refresh rotates token pair and returns serialized user', async () => {
    const now = new Date('2026-02-24T09:00:00.000Z')
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' })
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'manager@jtrack.local',
      name: 'Manager',
      isAdmin: true,
      passwordHash: 'stored-password-hash',
      refreshTokenHash: 'stored-refresh-hash',
      createdAt: now,
      updatedAt: now
    })
    compareMock.mockResolvedValue(true)
    jwtService.signAsync.mockResolvedValueOnce('access-2').mockResolvedValueOnce('refresh-2')
    hashMock.mockResolvedValue('refresh-hash-2')
    prisma.user.update.mockResolvedValue({})

    const result = await service.refresh('refresh-raw-token')

    expect(result).toEqual({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      user: {
        id: 'user-1',
        email: 'manager@jtrack.local',
        name: 'Manager',
        isAdmin: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    })
  })

  it('completeInvite activates invited membership and returns token pair', async () => {
    const now = new Date('2026-02-24T09:00:00.000Z')
    prisma.$transaction.mockImplementation(
      async (
        callback: (tx: {
          user: { update: typeof prisma.user.update }
          userLocation: { updateMany: typeof prisma.userLocation.updateMany }
        }) => Promise<unknown>
      ) =>
        callback({
          user: { update: prisma.user.update },
          userLocation: { updateMany: prisma.userLocation.updateMany }
        })
    )

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      locationId: 'loc-1',
      type: 'invite'
    })
    prisma.userLocation.updateMany.mockResolvedValue({ count: 1 })
    hashMock.mockResolvedValueOnce('new-password-hash').mockResolvedValueOnce('refresh-hash-3')
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'invitee@jtrack.local',
      name: 'Invitee',
      isAdmin: false,
      createdAt: now,
      updatedAt: now
    })
    jwtService.signAsync.mockResolvedValueOnce('access-3').mockResolvedValueOnce('refresh-3')

    const result = await service.completeInvite({
      token: 'invite-token',
      password: 'StrongPass123!'
    })

    expect(result).toEqual({
      accessToken: 'access-3',
      refreshToken: 'refresh-3',
      user: {
        id: 'user-1',
        email: 'invitee@jtrack.local',
        name: 'Invitee',
        isAdmin: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'new-password-hash', refreshTokenHash: null },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    })
    expect(prisma.userLocation.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        locationId: 'loc-1',
        status: 'invited'
      },
      data: { status: 'active' }
    })
  })

  it('completeInvite rejects invalid or already-used invites', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('bad token'))

    await expect(
      service.completeInvite({
        token: 'invalid',
        password: 'StrongPass123!'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException)

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      locationId: 'loc-1',
      type: 'invite'
    })
    prisma.userLocation.updateMany.mockResolvedValue({ count: 0 })

    await expect(
      service.completeInvite({
        token: 'invite-token',
        password: 'StrongPass123!'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('me returns serialized user and throws for unknown users', async () => {
    const now = new Date('2026-02-24T09:00:00.000Z')
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'owner@jtrack.local',
      name: 'Owner',
      isAdmin: true,
      createdAt: now,
      updatedAt: now
    })

    await expect(service.me('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'owner@jtrack.local',
      name: 'Owner',
      isAdmin: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    })

    prisma.user.findUnique.mockResolvedValueOnce(null)
    await expect(service.me('missing-user')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('honors secure refresh cookie override and NODE_ENV fallback', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'COOKIE_SECURE') {
        return 'yes'
      }

      if (key === 'NODE_ENV') {
        return 'development'
      }

      return undefined
    })

    expect(service.getRefreshCookieOptions().secure).toBe(true)

    configService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') {
        return 'production'
      }

      return undefined
    })

    expect(service.getRefreshCookieOptions().secure).toBe(true)
  })
})
