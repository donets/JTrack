import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { type Prisma } from '@prisma/client'
import { createUserSchema, updateUserSchema, type RoleKey } from '@jtrack/shared'
import { PrismaService } from '@/prisma/prisma.service'

const DELETED_USER_SYSTEM_EMAIL = 'system+deleted-user@jtrack.local'
const DELETED_USER_SYSTEM_NAME = 'System Deleted User'

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

    return memberships.map((membership: (typeof memberships)[number]) => ({
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
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      })

      if (!user) {
        throw new NotFoundException('User not found')
      }

      if (user.email === DELETED_USER_SYSTEM_EMAIL) {
        throw new BadRequestException('System deleted-user account cannot be removed')
      }

      await tx.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null }
      })

      const replacementUserId = await this.getOrCreateDeletedUserSystemAccount(tx)

      await tx.ticket.updateMany({
        where: { createdByUserId: userId },
        data: { createdByUserId: replacementUserId }
      })

      await tx.ticket.updateMany({
        where: { assignedToUserId: userId },
        data: { assignedToUserId: replacementUserId }
      })

      await tx.ticketComment.updateMany({
        where: { authorUserId: userId },
        data: { authorUserId: replacementUserId }
      })

      await tx.ticketAttachment.updateMany({
        where: { uploadedByUserId: userId },
        data: { uploadedByUserId: replacementUserId }
      })

      await tx.userLocation.deleteMany({ where: { userId } })
      await tx.user.delete({ where: { id: userId } })
    })

    return { ok: true }
  }

  private async getOrCreateDeletedUserSystemAccount(tx: Prisma.TransactionClient) {
    const existingSystemUser = await tx.user.findUnique({
      where: { email: DELETED_USER_SYSTEM_EMAIL },
      select: { id: true }
    })

    if (existingSystemUser) {
      return existingSystemUser.id
    }

    const passwordHash = await hash(randomUUID(), 12)
    const systemUser = await tx.user.create({
      data: {
        email: DELETED_USER_SYSTEM_EMAIL,
        name: DELETED_USER_SYSTEM_NAME,
        passwordHash,
        isAdmin: false
      },
      select: { id: true }
    })

    return systemUser.id
  }
}
