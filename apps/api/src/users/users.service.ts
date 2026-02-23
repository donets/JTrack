import { Injectable } from '@nestjs/common'
import { hash } from 'bcryptjs'
import { createUserSchema, updateUserSchema, type RoleKey } from '@jtrack/shared'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listByLocation(locationId: string) {
    const memberships = await this.prisma.userLocation.findMany({
      where: { locationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isAdmin: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return memberships.map((membership) => ({
      ...membership.user,
      role: membership.role,
      membershipStatus: membership.status,
      createdAt: membership.user.createdAt.toISOString(),
      updatedAt: membership.user.updatedAt.toISOString()
    }))
  }

  async create(data: unknown, locationId?: string) {
    const input = createUserSchema.parse(data)
    const passwordHash = await hash(input.password ?? 'ChangeMe123!', 12)

    const user = await this.prisma.user.upsert({
      where: { email: input.email },
      update: {
        name: input.name,
        passwordHash
      },
      create: {
        email: input.email,
        name: input.name,
        passwordHash
      }
    })

    const targetLocationId = input.locationId ?? locationId

    if (targetLocationId) {
      await this.prisma.userLocation.upsert({
        where: {
          userId_locationId: {
            userId: user.id,
            locationId: targetLocationId
          }
        },
        update: {
          role: (input.role ?? 'Technician') as RoleKey,
          status: 'active'
        },
        create: {
          userId: user.id,
          locationId: targetLocationId,
          role: (input.role ?? 'Technician') as RoleKey,
          status: 'active'
        }
      })
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }
  }

  async invite(data: unknown, locationId: string) {
    const input = createUserSchema.parse(data)
    const passwordHash = await hash(input.password ?? 'InviteOnly123!', 12)

    const user = await this.prisma.user.upsert({
      where: { email: input.email },
      update: {
        name: input.name
      },
      create: {
        email: input.email,
        name: input.name,
        passwordHash
      }
    })

    await this.prisma.userLocation.upsert({
      where: {
        userId_locationId: {
          userId: user.id,
          locationId
        }
      },
      update: {
        role: (input.role ?? 'Technician') as RoleKey,
        status: 'invited'
      },
      create: {
        userId: user.id,
        locationId,
        role: (input.role ?? 'Technician') as RoleKey,
        status: 'invited'
      }
    })

    return {
      ok: true,
      userId: user.id,
      status: 'invited'
    }
  }

  async update(userId: string, data: unknown) {
    const input = updateUserSchema.parse(data)

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }
  }

  async getById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return null
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }
  }

  async remove(userId: string) {
    await this.prisma.userLocation.deleteMany({ where: { userId } })
    await this.prisma.user.delete({ where: { id: userId } })
    return { ok: true }
  }
}
