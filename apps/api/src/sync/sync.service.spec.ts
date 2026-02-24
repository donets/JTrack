import { ForbiddenException } from '@nestjs/common'
import type { SyncChanges } from '@jtrack/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SyncService } from './sync.service'

const LOCATION_ID = 'loc-1'
const OTHER_LOCATION_ID = 'loc-2'
const USER_ID = 'user-1'
const TICKET_ID = 'ticket-1'

const createEmptyChanges = (): SyncChanges => ({
  tickets: { created: [], updated: [], deleted: [] },
  ticketComments: { created: [], updated: [], deleted: [] },
  ticketAttachments: { created: [], updated: [], deleted: [] },
  paymentRecords: { created: [], updated: [], deleted: [] }
})

describe('SyncService', () => {
  let service: SyncService
  let prisma: {
    ticket: { findMany: ReturnType<typeof vi.fn> }
    ticketComment: { findMany: ReturnType<typeof vi.fn> }
    ticketAttachment: { findMany: ReturnType<typeof vi.fn> }
    paymentRecord: { findMany: ReturnType<typeof vi.fn> }
    $transaction: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    prisma = {
      ticket: { findMany: vi.fn() },
      ticketComment: { findMany: vi.fn() },
      ticketAttachment: { findMany: vi.fn() },
      paymentRecord: { findMany: vi.fn() },
      $transaction: vi.fn()
    }

    service = new SyncService(prisma as never)
  })

  it('pull enforces location header/body match', async () => {
    await expect(
      service.pull(
        {
          locationId: LOCATION_ID,
          lastPulledAt: 0
        },
        OTHER_LOCATION_ID
      )
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('pull classifies created/updated/deleted records and serializes timestamps', async () => {
    const lastPulledAt = new Date('2026-02-24T08:00:00.000Z').getTime()

    prisma.ticket.findMany.mockResolvedValue([
      {
        id: 'ticket-created',
        locationId: LOCATION_ID,
        createdByUserId: USER_ID,
        assignedToUserId: null,
        title: 'Created ticket',
        description: null,
        status: 'New',
        scheduledStartAt: null,
        scheduledEndAt: null,
        priority: null,
        totalAmountCents: null,
        currency: 'EUR',
        createdAt: new Date('2026-02-24T08:01:00.000Z'),
        updatedAt: new Date('2026-02-24T08:01:00.000Z'),
        deletedAt: null
      },
      {
        id: 'ticket-updated',
        locationId: LOCATION_ID,
        createdByUserId: USER_ID,
        assignedToUserId: null,
        title: 'Updated ticket',
        description: null,
        status: 'InProgress',
        scheduledStartAt: null,
        scheduledEndAt: null,
        priority: null,
        totalAmountCents: null,
        currency: 'EUR',
        createdAt: new Date('2026-02-24T06:00:00.000Z'),
        updatedAt: new Date('2026-02-24T08:02:00.000Z'),
        deletedAt: null
      },
      {
        id: 'ticket-deleted',
        locationId: LOCATION_ID,
        createdByUserId: USER_ID,
        assignedToUserId: null,
        title: 'Deleted ticket',
        description: null,
        status: 'Done',
        scheduledStartAt: null,
        scheduledEndAt: null,
        priority: null,
        totalAmountCents: null,
        currency: 'EUR',
        createdAt: new Date('2026-02-24T06:00:00.000Z'),
        updatedAt: new Date('2026-02-24T08:03:00.000Z'),
        deletedAt: new Date('2026-02-24T08:03:00.000Z')
      }
    ])

    prisma.ticketComment.findMany.mockResolvedValue([
      {
        id: 'comment-created',
        ticketId: TICKET_ID,
        locationId: LOCATION_ID,
        authorUserId: USER_ID,
        body: 'Comment',
        createdAt: new Date('2026-02-24T08:02:00.000Z'),
        updatedAt: new Date('2026-02-24T08:02:00.000Z'),
        deletedAt: null
      }
    ])

    prisma.ticketAttachment.findMany.mockResolvedValue([
      {
        id: 'attachment-deleted',
        ticketId: TICKET_ID,
        locationId: LOCATION_ID,
        uploadedByUserId: USER_ID,
        kind: 'Photo',
        storageKey: 'uploads/1',
        url: 'https://cdn.jtrack.local/1',
        mimeType: 'image/png',
        size: 1024,
        width: 100,
        height: 100,
        createdAt: new Date('2026-02-24T06:00:00.000Z'),
        updatedAt: new Date('2026-02-24T08:02:00.000Z'),
        deletedAt: new Date('2026-02-24T08:02:00.000Z')
      }
    ])

    prisma.paymentRecord.findMany.mockResolvedValue([
      {
        id: 'payment-updated',
        ticketId: TICKET_ID,
        locationId: LOCATION_ID,
        provider: 'manual',
        amountCents: 5000,
        currency: 'EUR',
        status: 'Succeeded',
        createdAt: new Date('2026-02-24T07:00:00.000Z'),
        updatedAt: new Date('2026-02-24T08:05:00.000Z')
      }
    ])

    const response = await service.pull(
      {
        locationId: LOCATION_ID,
        lastPulledAt
      },
      LOCATION_ID
    )

    expect(response.changes.tickets.created.map((item) => item.id)).toEqual(['ticket-created'])
    expect(response.changes.tickets.updated.map((item) => item.id)).toEqual(['ticket-updated'])
    expect(response.changes.tickets.deleted).toEqual(['ticket-deleted'])
    expect(response.changes.ticketComments.created.map((item) => item.id)).toEqual(['comment-created'])
    expect(response.changes.ticketAttachments.deleted).toEqual(['attachment-deleted'])
    expect(response.changes.paymentRecords.updated.map((item) => item.id)).toEqual(['payment-updated'])
    expect(response.timestamp).toBeTypeOf('number')
    expect(response.hasMore).toBe(false)
    expect(response.nextCursor).toBeNull()
  })

  it('pull paginates with cursor and keeps timestamp snapshot stable', async () => {
    const lastPulledAt = new Date('2026-02-24T08:00:00.000Z').getTime()

    const tickets = [
      {
        id: 'ticket-page-1',
        locationId: LOCATION_ID,
        createdByUserId: USER_ID,
        assignedToUserId: null,
        title: 'Paged ticket 1',
        description: null,
        status: 'New',
        scheduledStartAt: null,
        scheduledEndAt: null,
        priority: null,
        totalAmountCents: null,
        currency: 'EUR',
        createdAt: new Date('2026-02-24T07:00:00.000Z'),
        updatedAt: new Date('2026-02-24T08:01:00.000Z'),
        deletedAt: null
      },
      {
        id: 'ticket-page-2',
        locationId: LOCATION_ID,
        createdByUserId: USER_ID,
        assignedToUserId: null,
        title: 'Paged ticket 2',
        description: null,
        status: 'InProgress',
        scheduledStartAt: null,
        scheduledEndAt: null,
        priority: null,
        totalAmountCents: null,
        currency: 'EUR',
        createdAt: new Date('2026-02-24T07:10:00.000Z'),
        updatedAt: new Date('2026-02-24T08:02:00.000Z'),
        deletedAt: null
      }
    ]

    prisma.ticket.findMany.mockImplementation(
      async ({ skip = 0, take = 101 }: { skip?: number; take?: number }) =>
        tickets.slice(skip, skip + take)
    )
    prisma.ticketComment.findMany.mockResolvedValue([])
    prisma.ticketAttachment.findMany.mockResolvedValue([])
    prisma.paymentRecord.findMany.mockResolvedValue([])

    const firstPage = await service.pull(
      {
        locationId: LOCATION_ID,
        lastPulledAt,
        limit: 1
      },
      LOCATION_ID
    )

    expect(firstPage.changes.tickets.updated.map((item) => item.id)).toEqual(['ticket-page-1'])
    expect(firstPage.hasMore).toBe(true)
    expect(firstPage.nextCursor).not.toBeNull()

    const secondPage = await service.pull(
      {
        locationId: LOCATION_ID,
        lastPulledAt,
        limit: 1,
        cursor: firstPage.nextCursor
      },
      LOCATION_ID
    )

    expect(secondPage.changes.tickets.updated.map((item) => item.id)).toEqual(['ticket-page-2'])
    expect(secondPage.hasMore).toBe(false)
    expect(secondPage.nextCursor).toBeNull()
    expect(secondPage.timestamp).toBe(firstPage.timestamp)
    expect(prisma.ticket.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ skip: 0, take: 2 })
    )
    expect(prisma.ticket.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ skip: 1, take: 2 })
    )
  })

  it('push writes create/update/delete operations in a single transaction', async () => {
    const lastPulledAt = new Date('2026-02-24T08:00:00.000Z').getTime()

    const tx = {
      ticket: {
        findUnique: vi.fn(async ({ where: { id } }: { where: { id: string } }) => {
          if (id === 'ticket-created') {
            return null
          }

          if (id === 'ticket-updated' || id === 'ticket-deleted') {
            return {
              id,
              locationId: LOCATION_ID,
              updatedAt: new Date(lastPulledAt - 5000)
            }
          }

          return null
        }),
        create: vi.fn(),
        update: vi.fn()
      },
      ticketComment: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      },
      ticketAttachment: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      },
      paymentRecord: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(),
        update: vi.fn()
      }
    }

    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<void>) => callback(tx)
    )

    const changes = createEmptyChanges()
    changes.tickets.created.push({
      id: 'ticket-created',
      locationId: LOCATION_ID,
      createdByUserId: USER_ID,
      assignedToUserId: null,
      title: 'Created from client',
      description: null,
      status: 'New',
      scheduledStartAt: null,
      scheduledEndAt: null,
      priority: null,
      totalAmountCents: null,
      currency: 'EUR',
      createdAt: '2026-02-24T07:58:00.000Z',
      updatedAt: '2026-02-24T07:58:00.000Z',
      deletedAt: null
    })
    changes.tickets.updated.push({
      id: 'ticket-updated',
      locationId: LOCATION_ID,
      createdByUserId: USER_ID,
      assignedToUserId: null,
      title: 'Updated from client',
      description: null,
      status: 'InProgress',
      scheduledStartAt: null,
      scheduledEndAt: null,
      priority: 'high',
      totalAmountCents: 12000,
      currency: 'EUR',
      createdAt: '2026-02-24T07:00:00.000Z',
      updatedAt: '2026-02-24T07:58:00.000Z',
      deletedAt: null
    })
    changes.tickets.deleted.push('ticket-deleted')
    changes.paymentRecords.created.push({
      id: 'payment-created',
      ticketId: TICKET_ID,
      locationId: LOCATION_ID,
      provider: 'manual',
      amountCents: 5000,
      currency: 'EUR',
      status: 'Succeeded',
      createdAt: '2026-02-24T07:59:00.000Z',
      updatedAt: '2026-02-24T07:59:00.000Z'
    })

    const response = await service.push(
      {
        locationId: LOCATION_ID,
        lastPulledAt,
        changes,
        clientId: 'client-1'
      },
      LOCATION_ID
    )

    expect(response.ok).toBe(true)
    expect(response.newTimestamp).toBeTypeOf('number')

    expect(tx.ticket.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'ticket-created',
        locationId: LOCATION_ID,
        title: 'Created from client'
      })
    })

    expect(tx.ticket.update).toHaveBeenCalledWith({
      where: { id: 'ticket-updated' },
      data: expect.objectContaining({
        title: 'Updated from client',
        status: 'InProgress',
        deletedAt: null
      })
    })

    expect(tx.ticket.update).toHaveBeenCalledWith({
      where: { id: 'ticket-deleted' },
      data: expect.objectContaining({
        deletedAt: expect.any(Date)
      })
    })

    expect(tx.paymentRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'payment-created',
        ticketId: TICKET_ID,
        status: 'Succeeded'
      })
    })
  })

  it('push skips stale client updates when server record is newer', async () => {
    const lastPulledAt = new Date('2026-02-24T08:00:00.000Z').getTime()

    const tx = {
      ticket: {
        findUnique: vi.fn(async () => ({
          id: 'ticket-updated',
          locationId: LOCATION_ID,
          updatedAt: new Date(lastPulledAt + 60_000)
        })),
        create: vi.fn(),
        update: vi.fn()
      },
      ticketComment: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      },
      ticketAttachment: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      },
      paymentRecord: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      }
    }

    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<void>) => callback(tx)
    )

    const changes = createEmptyChanges()
    changes.tickets.updated.push({
      id: 'ticket-updated',
      locationId: LOCATION_ID,
      createdByUserId: USER_ID,
      assignedToUserId: null,
      title: 'Client stale update',
      description: null,
      status: 'Scheduled',
      scheduledStartAt: null,
      scheduledEndAt: null,
      priority: null,
      totalAmountCents: null,
      currency: 'EUR',
      createdAt: '2026-02-24T07:00:00.000Z',
      updatedAt: '2026-02-24T07:59:00.000Z',
      deletedAt: null
    })

    await service.push(
      {
        locationId: LOCATION_ID,
        lastPulledAt,
        changes,
        clientId: 'client-1'
      },
      LOCATION_ID
    )

    expect(tx.ticket.create).not.toHaveBeenCalled()
    expect(tx.ticket.update).not.toHaveBeenCalled()
  })
})
