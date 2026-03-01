import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TicketsService } from './tickets.service'

const LOCATION_ID = 'loc-1'

const createTicketRecord = (id: string) => ({
  id,
  locationId: LOCATION_ID,
  ticketNumber: 42,
  createdByUserId: 'user-1',
  assignedToUserId: null,
  title: `Ticket ${id}`,
  description: null,
  status: 'New',
  scheduledStartAt: null,
  scheduledEndAt: null,
  priority: null,
  totalAmountCents: null,
  currency: 'EUR',
  createdAt: new Date('2026-02-24T12:00:00.000Z'),
  updatedAt: new Date('2026-02-24T12:05:00.000Z'),
  deletedAt: null
})

describe('TicketsService', () => {
  let service: TicketsService
  let prisma: {
    ticket: {
      findMany: ReturnType<typeof vi.fn>
      findFirst: ReturnType<typeof vi.fn>
      updateMany: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
    }
    $transaction: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    prisma = {
      ticket: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        aggregate: vi.fn()
      },
      $transaction: vi.fn()
    }

    service = new TicketsService(prisma as never)
  })

  it('list applies filters and returns page metadata', async () => {
    prisma.ticket.findMany.mockResolvedValue([
      createTicketRecord('ticket-3'),
      createTicketRecord('ticket-2'),
      createTicketRecord('ticket-1')
    ])

    const response = await service.list(LOCATION_ID, {
      status: 'New',
      assignedToUserId: 'user-2',
      limit: 2,
      offset: 4
    })

    expect(prisma.ticket.findMany).toHaveBeenCalledWith({
      where: {
        locationId: LOCATION_ID,
        deletedAt: null,
        status: 'New',
        assignedToUserId: 'user-2'
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: 4,
      take: 3
    })
    expect(response.items.map((item) => item.id)).toEqual(['ticket-3', 'ticket-2'])
    expect(response.page).toEqual({
      limit: 2,
      offset: 4,
      nextOffset: 6,
      hasMore: true
    })
    expect(response.items[0]?.updatedAt).toBe('2026-02-24T12:05:00.000Z')
  })

  it('list returns null nextOffset when page is fully consumed', async () => {
    prisma.ticket.findMany.mockResolvedValue([createTicketRecord('ticket-1')])

    const response = await service.list(LOCATION_ID, {
      limit: 2,
      offset: 0
    })

    expect(response.items.map((item) => item.id)).toEqual(['ticket-1'])
    expect(response.page).toEqual({
      limit: 2,
      offset: 0,
      nextOffset: null,
      hasMore: false
    })
  })

  it('transitionStatus rejects invalid transitions for role', async () => {
    prisma.ticket.findFirst.mockResolvedValue({ status: 'New' })

    await expect(
      service.transitionStatus(LOCATION_ID, 'Technician', 'ticket-1', 'Done')
    ).rejects.toThrow('cannot transition')

    expect(prisma.ticket.updateMany).not.toHaveBeenCalled()
  })

  it('transitionStatus updates status when transition is valid', async () => {
    prisma.ticket.findFirst.mockResolvedValue({ status: 'New' })
    prisma.ticket.updateMany.mockResolvedValue({ count: 1 })
    vi.spyOn(service, 'getById').mockResolvedValue({
      id: 'ticket-1',
      locationId: LOCATION_ID
    } as never)

    const result = await service.transitionStatus(
      LOCATION_ID,
      'Technician',
      'ticket-1',
      'InProgress'
    )

    expect(prisma.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'ticket-1',
        locationId: LOCATION_ID,
        deletedAt: null
      },
      data: {
        status: 'InProgress'
      }
    })
    expect(result).toEqual({
      id: 'ticket-1',
      locationId: LOCATION_ID
    })
  })
})
