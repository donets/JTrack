import { ForbiddenException, Injectable } from '@nestjs/common'
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

      return locations.map((location) => ({
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

    return memberships.map((membership) => ({
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

    return this.prisma.$transaction(async (tx) => {
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

    await this.prisma.location.delete({ where: { id: locationId } })
    return { ok: true }
  }
}
