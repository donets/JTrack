import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { type Prisma } from '@prisma/client'
import { createLocationSchema, updateLocationSchema } from '@jtrack/shared'
import type { JwtUser } from '@/common/types'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(user: JwtUser) {
    if (user.isAdmin) {
      const locations = await this.prisma.location.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return locations.map((location: (typeof locations)[number]) => ({
        id: location.id,
        name: location.name,
        timezone: location.timezone,
        address: location.address,
        role: 'Owner',
        membershipStatus: 'active',
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString()
      }))
    }

    const memberships = await this.prisma.userLocation.findMany({
      where: { userId: user.sub },
      include: {
        location: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return memberships.map((membership: (typeof memberships)[number]) => ({
      id: membership.location.id,
      name: membership.location.name,
      timezone: membership.location.timezone,
      address: membership.location.address,
      role: membership.role,
      membershipStatus: membership.status,
      createdAt: membership.location.createdAt.toISOString(),
      updatedAt: membership.location.updatedAt.toISOString()
    }))
  }

  async create(user: JwtUser, data: unknown) {
    const input = createLocationSchema.parse(data)

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const location = await tx.location.create({
        data: {
          name: input.name,
          timezone: input.timezone,
          address: input.address
        }
      })

      await tx.userLocation.upsert({
        where: {
          userId_locationId: {
            userId: user.sub,
            locationId: location.id
          }
        },
        update: {
          role: 'Owner',
          status: 'active'
        },
        create: {
          userId: user.sub,
          locationId: location.id,
          role: 'Owner',
          status: 'active'
        }
      })

      return {
        id: location.id,
        name: location.name,
        timezone: location.timezone,
        address: location.address,
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString()
      }
    })
  }

  async update(user: JwtUser, locationId: string, data: unknown) {
    const input = updateLocationSchema.parse(data)

    if (!user.isAdmin) {
      const membership = await this.prisma.userLocation.findUnique({
        where: {
          userId_locationId: {
            userId: user.sub,
            locationId
          }
        }
      })

      if (!membership || membership.role !== 'Owner') {
        throw new ForbiddenException('Only location owners can update this location')
      }
    }

    const location = await this.prisma.location.update({
      where: { id: locationId },
      data: input
    })

    return {
      id: location.id,
      name: location.name,
      timezone: location.timezone,
      address: location.address,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString()
    }
  }

  async remove(user: JwtUser, locationId: string) {
    if (!user.isAdmin) {
      const membership = await this.prisma.userLocation.findUnique({
        where: {
          userId_locationId: {
            userId: user.sub,
            locationId
          }
        }
      })

      if (!membership || membership.role !== 'Owner') {
        throw new ForbiddenException('Only location owners can delete this location')
      }
    }

    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true }
    })

    if (!location) {
      throw new NotFoundException('Location not found')
    }

    const [ticketCount, commentCount, attachmentCount, paymentCount] = await Promise.all([
      this.prisma.ticket.count({ where: { locationId } }),
      this.prisma.ticketComment.count({ where: { locationId } }),
      this.prisma.ticketAttachment.count({ where: { locationId } }),
      this.prisma.paymentRecord.count({ where: { locationId } })
    ])

    if (ticketCount + commentCount + attachmentCount + paymentCount > 0) {
      throw new ConflictException('Cannot delete location with related business records')
    }

    await this.prisma.location.delete({ where: { id: locationId } })
    return { ok: true }
  }
}
