import { UnauthorizedException } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from './auth.service'

vi.mock('argon2', () => ({
  argon2id: 2,
  hash: vi.fn().mockResolvedValue('argon2-hashed'),
  verify: vi.fn().mockResolvedValue(true)
}))

vi.mock('bcryptjs', () => ({
  compare: vi.fn().mockResolvedValue(false)
}))

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

describe('AuthService', () => {
  let service: AuthService
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
    }
    session: {
      create: ReturnType<typeof vi.fn>
      findFirst: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      updateMany: ReturnType<typeof vi.fn>
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
  let mailService: {
    sendVerificationCode: ReturnType<typeof vi.fn>
    sendPasswordResetCode: ReturnType<typeof vi.fn>
    sendPasswordChangedNotification: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      session: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn()
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

    mailService = {
      sendVerificationCode: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetCode: vi.fn().mockResolvedValue(undefined),
      sendPasswordChangedNotification: vi.fn().mockResolvedValue(undefined)
    }

    service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never,
      mailService as never
    )

    prisma.$transaction.mockImplementation(
      async (
        callbackOrArray:
          | ((tx: {
              user: { update: typeof prisma.user.update }
              userLocation: { updateMany: typeof prisma.userLocation.updateMany }
            }) => Promise<unknown>)
          | unknown[]
      ) => {
        if (typeof callbackOrArray === 'function') {
          return callbackOrArray({
            user: { update: prisma.user.update },
            userLocation: { updateMany: prisma.userLocation.updateMany }
          })
        }
        // batch transaction (array of promises) — resolve them
        return Promise.all(callbackOrArray)
      }
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

    expect(prisma.session.create).not.toHaveBeenCalled()
  })

  it('returns tokens and creates session on login', async () => {
    const now = new Date('2026-02-24T09:00:00.000Z')
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'tech@jtrack.local',
      name: 'Tech',
      isAdmin: false,
      passwordHash: 'argon2-stored-hash',
      tokenVersion: 0,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now
    })

    prisma.session.create.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: ''
    })

    jwtService.signAsync.mockResolvedValueOnce('access-1').mockResolvedValueOnce('refresh-1')
    prisma.session.update.mockResolvedValue({})
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

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        refreshTokenHash: ''
      })
    })
  })

  it('refresh rejects when session not found by jti', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', jti: 'session-1' })
    prisma.session.findUnique.mockResolvedValue(null)

    await expect(service.refresh('refresh-raw-token')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('refresh detects reuse when hash mismatches on non-revoked session', async () => {
    const now = new Date()
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', jti: 'session-1' })
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: 'old-hash-that-does-not-match',
      revokedAt: null,
      lastUsedAt: now,
      createdAt: now
    })
    prisma.session.updateMany.mockResolvedValue({ count: 2 })

    await expect(service.refresh('refresh-raw-token')).rejects.toBeInstanceOf(UnauthorizedException)

    // All sessions for the user should be revoked
    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    })
  })

  it('refresh rotates token pair and returns serialized user', async () => {
    const now = new Date('2026-02-24T09:00:00.000Z')
    const tokenHash = sha256('refresh-raw-token')

    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', jti: 'session-1' })
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: tokenHash,
      revokedAt: null,
      lastUsedAt: now,
      createdAt: now
    })
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'manager@jtrack.local',
      name: 'Manager',
      isAdmin: true,
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now
    })
    jwtService.signAsync.mockResolvedValueOnce('access-2').mockResolvedValueOnce('refresh-2')
    prisma.session.update.mockResolvedValue({})

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

    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: {
        refreshTokenHash: sha256('refresh-2'),
        lastUsedAt: expect.any(Date)
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
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'invitee@jtrack.local',
      name: 'Invitee',
      isAdmin: false,
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now
    })
    prisma.session.create.mockResolvedValue({
      id: 'session-2',
      userId: 'user-1',
      refreshTokenHash: ''
    })
    jwtService.signAsync.mockResolvedValueOnce('access-3').mockResolvedValueOnce('refresh-3')
    prisma.session.update.mockResolvedValue({})

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
      data: { passwordHash: 'argon2-hashed', emailVerifiedAt: expect.any(Date) },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        tokenVersion: true,
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
    expect(prisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        refreshTokenHash: ''
      })
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

  it('supports configurable sameSite and forces secure for SameSite=None', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'COOKIE_SAME_SITE') {
        return 'none'
      }

      if (key === 'COOKIE_SECURE') {
        return 'false'
      }

      return undefined
    })

    expect(service.getRefreshCookieOptions()).toMatchObject({
      sameSite: 'none',
      secure: true
    })

    configService.get.mockImplementation((key: string) => {
      if (key === 'COOKIE_SAME_SITE') {
        return 'strict'
      }

      if (key === 'COOKIE_SECURE') {
        return 'yes'
      }

      return undefined
    })

    expect(service.getRefreshCookieOptions()).toMatchObject({
      sameSite: 'strict',
      secure: true
    })
  })
})
