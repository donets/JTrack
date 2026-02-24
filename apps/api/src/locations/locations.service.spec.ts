import {
  ConflictException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LocationsService } from './locations.service'

const ADMIN_USER = {
  sub: 'admin-1',
  email: 'admin@jtrack.local',
  isAdmin: true
}

const OWNER_USER = {
  sub: 'owner-1',
  email: 'owner@jtrack.local',
  isAdmin: false
}

const NON_OWNER_USER = {
  sub: 'tech-1',
  email: 'tech@jtrack.local',
  isAdmin: false
}

describe('LocationsService', () => {
  let service: LocationsService
  let prisma: {
    userLocation: { findUnique: ReturnType<typeof vi.fn> }
    location: {
      findUnique: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
    }
    ticket: { count: ReturnType<typeof vi.fn> }
    ticketComment: { count: ReturnType<typeof vi.fn> }
    ticketAttachment: { count: ReturnType<typeof vi.fn> }
    paymentRecord: { count: ReturnType<typeof vi.fn> }
  }

  beforeEach(() => {
    prisma = {
      userLocation: { findUnique: vi.fn() },
      location: {
        findUnique: vi.fn(),
        delete: vi.fn()
      },
      ticket: { count: vi.fn() },
      ticketComment: { count: vi.fn() },
      ticketAttachment: { count: vi.fn() },
      paymentRecord: { count: vi.fn() }
    }

    service = new LocationsService(prisma as never)
  })

  it('remove rejects non-owner non-admin users', async () => {
    prisma.userLocation.findUnique.mockResolvedValue({
      userId: NON_OWNER_USER.sub,
      locationId: 'loc-1',
      role: 'Technician'
    })

    await expect(service.remove(NON_OWNER_USER, 'loc-1')).rejects.toBeInstanceOf(ForbiddenException)
    expect(prisma.location.delete).not.toHaveBeenCalled()
  })

  it('remove returns 404 when location is missing', async () => {
    prisma.userLocation.findUnique.mockResolvedValue({
      userId: OWNER_USER.sub,
      locationId: 'loc-1',
      role: 'Owner'
    })
    prisma.location.findUnique.mockResolvedValue(null)

    await expect(service.remove(OWNER_USER, 'loc-1')).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.location.delete).not.toHaveBeenCalled()
  })

  it('remove rejects deletion when location has related business records', async () => {
    prisma.userLocation.findUnique.mockResolvedValue({
      userId: OWNER_USER.sub,
      locationId: 'loc-1',
      role: 'Owner'
    })
    prisma.location.findUnique.mockResolvedValue({ id: 'loc-1' })
    prisma.ticket.count.mockResolvedValue(1)
    prisma.ticketComment.count.mockResolvedValue(0)
    prisma.ticketAttachment.count.mockResolvedValue(0)
    prisma.paymentRecord.count.mockResolvedValue(0)

    await expect(service.remove(OWNER_USER, 'loc-1')).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.location.delete).not.toHaveBeenCalled()
  })

  it('remove deletes location when admin and no related business records', async () => {
    prisma.location.findUnique.mockResolvedValue({ id: 'loc-1' })
    prisma.ticket.count.mockResolvedValue(0)
    prisma.ticketComment.count.mockResolvedValue(0)
    prisma.ticketAttachment.count.mockResolvedValue(0)
    prisma.paymentRecord.count.mockResolvedValue(0)

    const result = await service.remove(ADMIN_USER, 'loc-1')

    expect(result).toEqual({ ok: true })
    expect(prisma.location.delete).toHaveBeenCalledWith({ where: { id: 'loc-1' } })
    expect(prisma.userLocation.findUnique).not.toHaveBeenCalled()
  })
})
