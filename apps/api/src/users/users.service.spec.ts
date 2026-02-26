import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersService } from './users.service'

vi.mock('argon2', () => ({
  argon2id: 2,
  hash: vi.fn()
}))

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn()
}))

const hashMock = vi.mocked(argon2.hash)
const randomUuidMock = vi.mocked(randomUUID)
const SYSTEM_EMAIL = 'system+deleted-user@jtrack.local'

describe('UsersService.remove', () => {
  let service: UsersService
  let tx: {
    user: {
      findUnique: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
    }
    session: {
      updateMany: ReturnType<typeof vi.fn>
    }
    userLocation: {
      deleteMany: ReturnType<typeof vi.fn>
    }
    ticket: {
      updateMany: ReturnType<typeof vi.fn>
    }
    ticketComment: {
      updateMany: ReturnType<typeof vi.fn>
    }
    ticketAttachment: {
      updateMany: ReturnType<typeof vi.fn>
    }
  }
  let prisma: {
    $transaction: ReturnType<typeof vi.fn>
  }
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>
  }
  let configService: {
    get: ReturnType<typeof vi.fn>
    getOrThrow: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    tx = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
      },
      session: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 })
      },
      userLocation: {
        deleteMany: vi.fn()
      },
      ticket: {
        updateMany: vi.fn()
      },
      ticketComment: {
        updateMany: vi.fn()
      },
      ticketAttachment: {
        updateMany: vi.fn()
      }
    }

    prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx))
    }

    jwtService = {
      signAsync: vi.fn()
    }

    configService = {
      get: vi.fn(),
      getOrThrow: vi.fn((key: string) => `${key}-secret`)
    }

    hashMock.mockReset()
    randomUuidMock.mockReset()
    hashMock.mockResolvedValue('hashed-system-password' as never)
    randomUuidMock.mockReturnValue('generated-system-password')

    service = new UsersService(
      prisma as never,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService
    )
  })

  it('remove reassigns related records to existing system user and deletes target', async () => {
    tx.user.findUnique.mockImplementation(
      async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id === 'user-1') {
          return { id: 'user-1', email: 'operator@jtrack.local' }
        }

        if (where.email === SYSTEM_EMAIL) {
          return { id: 'system-user-id' }
        }

        return null
      }
    )

    const result = await service.remove('user-1')

    expect(result).toEqual({ ok: true })
    expect(tx.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    })
    expect(tx.ticket.updateMany).toHaveBeenCalledWith({
      where: { createdByUserId: 'user-1' },
      data: { createdByUserId: 'system-user-id' }
    })
    expect(tx.ticket.updateMany).toHaveBeenCalledWith({
      where: { assignedToUserId: 'user-1' },
      data: { assignedToUserId: 'system-user-id' }
    })
    expect(tx.ticketComment.updateMany).toHaveBeenCalledWith({
      where: { authorUserId: 'user-1' },
      data: { authorUserId: 'system-user-id' }
    })
    expect(tx.ticketAttachment.updateMany).toHaveBeenCalledWith({
      where: { uploadedByUserId: 'user-1' },
      data: { uploadedByUserId: 'system-user-id' }
    })
    expect(tx.userLocation.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' }
    })
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
    expect(hashMock).not.toHaveBeenCalled()
  })

  it('remove creates system user when it does not exist', async () => {
    tx.user.findUnique.mockImplementation(
      async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id === 'user-1') {
          return { id: 'user-1', email: 'operator@jtrack.local' }
        }

        if (where.email === SYSTEM_EMAIL) {
          return null
        }

        return null
      }
    )
    tx.user.create.mockResolvedValue({ id: 'created-system-user' })

    await service.remove('user-1')

    expect(randomUuidMock).toHaveBeenCalledTimes(1)
    expect(hashMock).toHaveBeenCalledWith('generated-system-password', expect.objectContaining({ type: 2 }))
    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        email: SYSTEM_EMAIL,
        name: 'System Deleted User',
        passwordHash: 'hashed-system-password',
        isAdmin: false
      },
      select: { id: true }
    })
    expect(tx.ticket.updateMany).toHaveBeenCalledWith({
      where: { createdByUserId: 'user-1' },
      data: { createdByUserId: 'created-system-user' }
    })
    expect(tx.ticket.updateMany).toHaveBeenCalledWith({
      where: { assignedToUserId: 'user-1' },
      data: { assignedToUserId: 'created-system-user' }
    })
  })

  it('remove throws not found when target user is missing', async () => {
    tx.user.findUnique.mockResolvedValue(null)

    await expect(service.remove('missing-user')).rejects.toBeInstanceOf(NotFoundException)
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.ticket.updateMany).not.toHaveBeenCalled()
    expect(tx.user.delete).not.toHaveBeenCalled()
  })

  it('remove rejects deleting system deleted-user account', async () => {
    tx.user.findUnique.mockResolvedValue({
      id: 'system-user-id',
      email: SYSTEM_EMAIL
    })

    await expect(service.remove('system-user-id')).rejects.toBeInstanceOf(BadRequestException)
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.ticket.updateMany).not.toHaveBeenCalled()
    expect(tx.user.delete).not.toHaveBeenCalled()
  })
})

describe('UsersService.invite', () => {
  let service: UsersService
  let prisma: {
    user: {
      upsert: ReturnType<typeof vi.fn>
    }
    userLocation: {
      upsert: ReturnType<typeof vi.fn>
    }
  }
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>
  }
  let configService: {
    get: ReturnType<typeof vi.fn>
    getOrThrow: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    prisma = {
      user: {
        upsert: vi.fn()
      },
      userLocation: {
        upsert: vi.fn()
      }
    }

    jwtService = {
      signAsync: vi.fn()
    }

    configService = {
      get: vi.fn(),
      getOrThrow: vi.fn((key: string) => `${key}-secret`)
    }

    hashMock.mockReset()
    randomUuidMock.mockReset()

    service = new UsersService(
      prisma as never,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService
    )
  })

  it('invite returns onboarding token and URL and does not use hardcoded password', async () => {
    randomUuidMock.mockReturnValue('generated-invite-secret')
    hashMock.mockResolvedValue('generated-password-hash' as never)
    prisma.user.upsert.mockResolvedValue({
      id: 'user-1',
      email: 'invitee@jtrack.local',
      name: 'Invitee',
      isAdmin: false,
      createdAt: new Date('2026-02-24T09:00:00.000Z'),
      updatedAt: new Date('2026-02-24T09:00:00.000Z')
    })
    jwtService.signAsync.mockResolvedValue('invite-token-1')
    configService.get.mockImplementation((key: string) => {
      if (key === 'WEB_ORIGIN') {
        return 'http://localhost:3000'
      }

      if (key === 'JWT_INVITE_SECRET') {
        return 'invite-secret'
      }

      if (key === 'JWT_INVITE_TTL') {
        return '7d'
      }

      return undefined
    })

    const result = await service.invite(
      {
        email: 'invitee@jtrack.local',
        name: 'Invitee',
        role: 'Technician'
      },
      'loc-1'
    )

    expect(hashMock).toHaveBeenCalledWith('generated-invite-secret', expect.objectContaining({ type: 2 }))
    expect(prisma.userLocation.upsert).toHaveBeenCalledWith({
      where: {
        userId_locationId: {
          userId: 'user-1',
          locationId: 'loc-1'
        }
      },
      update: {
        role: 'Technician',
        status: 'invited'
      },
      create: {
        userId: 'user-1',
        locationId: 'loc-1',
        role: 'Technician',
        status: 'invited'
      }
    })
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        locationId: 'loc-1',
        type: 'invite'
      }),
      expect.objectContaining({
        secret: 'invite-secret',
        expiresIn: '7d'
      })
    )
    expect(result).toEqual({
      ok: true,
      userId: 'user-1',
      status: 'invited',
      onboardingToken: 'invite-token-1',
      onboardingUrl: 'http://localhost:3000/invite/accept?token=invite-token-1'
    })
  })
})
