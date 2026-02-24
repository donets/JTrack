import { BadRequestException, NotFoundException } from '@nestjs/common'
import { hash } from 'bcryptjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersService } from './users.service'

vi.mock('bcryptjs', () => ({
  hash: vi.fn(async () => 'hashed-system-password')
}))

const SYSTEM_EMAIL = 'system+deleted-user@jtrack.local'

describe('UsersService', () => {
  let service: UsersService
  let tx: {
    user: {
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
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

  beforeEach(() => {
    tx = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
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

    service = new UsersService(prisma as never)
    vi.clearAllMocks()
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
    expect(tx.ticket.updateMany).toHaveBeenCalledWith({
      where: { createdByUserId: 'user-1' },
      data: { createdByUserId: 'system-user-id' }
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
    expect(hash).not.toHaveBeenCalled()
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

    expect(hash).toHaveBeenCalledWith('SystemUserDisabled123!', 12)
    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        email: SYSTEM_EMAIL,
        name: 'System Deleted User',
        passwordHash: 'hashed-system-password',
        isAdmin: true
      },
      select: { id: true }
    })
    expect(tx.ticket.updateMany).toHaveBeenCalledWith({
      where: { createdByUserId: 'user-1' },
      data: { createdByUserId: 'created-system-user' }
    })
  })

  it('remove throws not found when target user is missing', async () => {
    tx.user.findUnique.mockResolvedValue(null)

    await expect(service.remove('missing-user')).rejects.toBeInstanceOf(NotFoundException)
    expect(tx.ticket.updateMany).not.toHaveBeenCalled()
    expect(tx.user.delete).not.toHaveBeenCalled()
  })

  it('remove rejects deleting system deleted-user account', async () => {
    tx.user.findUnique.mockResolvedValue({
      id: 'system-user-id',
      email: SYSTEM_EMAIL
    })

    await expect(service.remove('system-user-id')).rejects.toBeInstanceOf(BadRequestException)
    expect(tx.ticket.updateMany).not.toHaveBeenCalled()
    expect(tx.user.delete).not.toHaveBeenCalled()
  })
})
