import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { randomUUID } from 'node:crypto'
import { type Prisma } from '@prisma/client'
import {
  type CreateUserInput,
  type InviteResponse,
  type RoleKey,
  type UpdateUserInput
} from '@jtrack/shared'
import { serializeDates } from '@/common/date-serializer'
import { PrismaService } from '@/prisma/prisma.service'

const DELETED_USER_SYSTEM_EMAIL = 'system+deleted-user@jtrack.local'
const DELETED_USER_SYSTEM_NAME = 'System Deleted User'
const INVITE_TOKEN_TYPE = 'invite'

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

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

    return memberships.map((membership: (typeof memberships)[number]) =>
      serializeDates({
        ...membership.user,
        role: membership.role,
        membershipStatus: membership.status
      })
    )
  }

  async create(input: CreateUserInput, locationId?: string) {
    const passwordHash = await argon2.hash(input.password ?? 'ChangeMe123!', { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })

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

    return serializeDates({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  }

  async invite(input: CreateUserInput, locationId: string): Promise<InviteResponse> {
    const passwordHash = await argon2.hash(randomUUID(), { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })

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

    const onboardingToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        locationId,
        type: INVITE_TOKEN_TYPE
      },
      {
        secret: this.configService.get<string>('JWT_INVITE_SECRET')
          ?? this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_INVITE_TTL') ?? '7d') as never
      }
    )

    const onboardingBaseUrl = this.configService.get<string>('WEB_ORIGIN') ?? ''
    const onboardingUrl = onboardingBaseUrl
      ? `${onboardingBaseUrl.replace(/\/$/, '')}/invite/accept?token=${encodeURIComponent(onboardingToken)}`
      : `/invite/accept?token=${encodeURIComponent(onboardingToken)}`

    return {
      ok: true,
      userId: user.id,
      status: 'invited',
      onboardingToken,
      onboardingUrl
    }
  }

  async update(userId: string, input: UpdateUserInput, locationId: string) {
    const userData: Prisma.UserUpdateInput = {}

    if (input.name !== undefined) {
      userData.name = input.name
    }

    if (input.isAdmin !== undefined) {
      userData.isAdmin = input.isAdmin
    }

    const hasMembershipUpdate = input.role !== undefined || input.membershipStatus !== undefined
    const hasUserUpdate = Object.keys(userData).length > 0

    const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingUser = await tx.user.findUnique({
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

      if (!existingUser) {
        throw new NotFoundException('User not found')
      }

      if (hasMembershipUpdate) {
        await tx.userLocation.upsert({
          where: {
            userId_locationId: {
              userId,
              locationId
            }
          },
          update: {
            ...(input.role !== undefined ? { role: input.role } : {}),
            ...(input.membershipStatus !== undefined ? { status: input.membershipStatus } : {})
          },
          create: {
            userId,
            locationId,
            role: input.role ?? 'Technician',
            status: input.membershipStatus ?? 'active'
          }
        })
      }

      if (hasUserUpdate) {
        return tx.user.update({
          where: { id: userId },
          data: userData,
          select: {
            id: true,
            email: true,
            name: true,
            isAdmin: true,
            createdAt: true,
            updatedAt: true
          }
        })
      }

      return existingUser
    })

    return serializeDates(user)
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

    return serializeDates(user)
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

      // Revoke all sessions for the user being deleted
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
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

    const passwordHash = await argon2.hash(randomUUID(), { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })
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
