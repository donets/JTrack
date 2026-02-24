import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { compare, hash } from 'bcryptjs'
import { type Prisma } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import type { InviteCompleteInput, LoginInput } from '@jtrack/shared'

const INVITE_TOKEN_TYPE = 'invite'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordMatches = await compare(input.password, user.passwordHash)

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const tokens = await this.createTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    })

    await this.setRefreshToken(user.id, tokens.refreshToken)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserResponse(user)
    }
  }

  async refresh(rawRefreshToken: string) {
    const payload = await this.jwtService.verifyAsync<{ sub: string }>(rawRefreshToken, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET')
    })

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const tokenMatches = await compare(rawRefreshToken, user.refreshTokenHash)

    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const tokens = await this.createTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    })

    await this.setRefreshToken(user.id, tokens.refreshToken)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserResponse(user)
    }
  }

  async completeInvite(input: InviteCompleteInput) {
    const payload = await this.verifyInviteToken(input.token)
    const passwordHash = await hash(input.password, 12)

    const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const activation = await tx.userLocation.updateMany({
        where: {
          userId: payload.sub,
          locationId: payload.locationId,
          status: 'invited'
        },
        data: {
          status: 'active'
        }
      })

      if (activation.count !== 1) {
        throw new UnauthorizedException('Invite is invalid or already used')
      }

      const updatedUser = await tx.user.update({
        where: { id: payload.sub },
        data: {
          passwordHash,
          refreshTokenHash: null
        },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true
        }
      })

      return updatedUser
    })

    const tokens = await this.createTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    })

    await this.setRefreshToken(user.id, tokens.refreshToken)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserResponse(user)
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null }
    })
  }

  async me(userId: string) {
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
      throw new UnauthorizedException('User does not exist')
    }

    return this.toUserResponse(user)
  }

  getRefreshCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.isSecureCookieEnabled(),
      path: '/auth',
      maxAge: 1000 * 60 * 60 * 24 * 30
    }
  }

  private isSecureCookieEnabled() {
    const raw = this.configService.get<string>('COOKIE_SECURE')

    if (raw !== undefined) {
      const normalized = raw.trim().toLowerCase()
      return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
    }

    return this.configService.get<string>('NODE_ENV') === 'production'
  }

  private async createTokens(payload: { sub: string; email: string; isAdmin: boolean }) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_ACCESS_TTL') ?? '15m') as never
    })

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_TTL') ?? '30d') as never
    })

    return { accessToken, refreshToken }
  }

  private async setRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await hash(refreshToken, 12)

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash }
    })
  }

  private async verifyInviteToken(rawToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string
        locationId: string
        type?: string
      }>(rawToken, {
        secret: this.configService.get<string>('JWT_INVITE_SECRET')
          ?? this.configService.getOrThrow<string>('JWT_REFRESH_SECRET')
      })

      if (payload.type !== INVITE_TOKEN_TYPE) {
        throw new UnauthorizedException('Invalid invite token')
      }

      return payload
    } catch {
      throw new UnauthorizedException('Invalid invite token')
    }
  }

  private toUserResponse(user: {
    id: string
    email: string
    name: string
    isAdmin: boolean
    createdAt: Date
    updatedAt: Date
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }
  }
}
