import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommentsService } from './comments.service'

const LOCATION_ID = 'loc-1'
const USER_ID = 'user-1'

describe('CommentsService', () => {
  let service: CommentsService
  let prisma: {
    ticket: {
      findFirst: ReturnType<typeof vi.fn>
    }
    ticketComment: {
      findMany: ReturnType<typeof vi.fn>
      findFirst: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      updateMany: ReturnType<typeof vi.fn>
    }
    ticketActivity: {
      create: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      ticket: {
        findFirst: vi.fn()
      },
      ticketComment: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn()
      },
      ticketActivity: {
        create: vi.fn()
      }
    }

    service = new CommentsService(prisma as never)
  })

  it('updates own comment body', async () => {
    prisma.ticketComment.findFirst.mockResolvedValue({
      id: 'comment-1',
      authorUserId: USER_ID
    })
    prisma.ticketComment.update.mockResolvedValue({
      id: 'comment-1',
      ticketId: 'ticket-1',
      locationId: LOCATION_ID,
      authorUserId: USER_ID,
      body: 'Updated body',
      createdAt: new Date('2026-03-02T10:00:00.000Z'),
      updatedAt: new Date('2026-03-02T11:00:00.000Z'),
      deletedAt: null
    })

    const updated = await service.update(LOCATION_ID, 'comment-1', USER_ID, {
      body: 'Updated body'
    })

    expect(prisma.ticketComment.update).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
      data: { body: 'Updated body' }
    })
    expect(updated.body).toBe('Updated body')
  })

  it('rejects editing someone else comment', async () => {
    prisma.ticketComment.findFirst.mockResolvedValue({
      id: 'comment-1',
      authorUserId: 'another-user'
    })

    await expect(
      service.update(LOCATION_ID, 'comment-1', USER_ID, {
        body: 'Updated body'
      })
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('returns not found when comment is missing', async () => {
    prisma.ticketComment.findFirst.mockResolvedValue(null)

    await expect(
      service.update(LOCATION_ID, 'comment-missing', USER_ID, {
        body: 'Updated body'
      })
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
