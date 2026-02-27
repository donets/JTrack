import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { compare as bcryptCompare } from 'bcryptjs'
import { createHash, randomInt } from 'node:crypto'
import { type Prisma } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { MailService } from '@/mail/mail.service'
import { serializeDates } from '@/common/date-serializer'
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  InviteCompleteInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailConfirmInput,
  VerifyEmailRequestInput
} from '@jtrack/shared'

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1
}

const DEFAULT_VERIFY_EMAIL_TTL_MINUTES = 15
const DEFAULT_RESET_PASSWORD_TTL_MINUTES = 15

const INVITE_TOKEN_TYPE = 'invite'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService
  ) {}

  // ── Register ───────────────────────────────────────────────────────

  async register(input: RegisterInput, ip?: string, ua?: string) {
    const email = this.normalizeEmail(input.email)

    const existing = await this.prisma.user.findUnique({ where: { email } })

    if (existing) {
      // Anti-enumeration: re-send verification if unverified, else silently succeed
      if (!existing.emailVerifiedAt) {
        const code = this.generateCode()
        const tokenHash = this.hashToken(code)

        await this.prisma.authToken.create({
          data: {
            userId: existing.id,
            type: 'EmailVerification',
            tokenHash,
            expiresAt: new Date(Date.now() + this.verifyEmailTtlMs()),
            createdByIp: ip,
            userAgent: ua
          }
        })

        await this.mailService.sendVerificationCode(email, code).catch((err) => {
          this.logger.error(`Failed to send verification email: ${err.message}`)
        })
      }

      return { ok: true }
    }

    const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS)

    const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name: input.name,
          passwordHash
        }
      })

      const location = await tx.location.create({
        data: {
          name: input.locationName,
          timezone: input.timezone,
          address: input.address
        }
      })

      await tx.userLocation.create({
        data: {
          userId: newUser.id,
          locationId: location.id,
          role: 'Owner',
          status: 'active'
        }
      })

      return newUser
    })

    const code = this.generateCode()
    const tokenHash = this.hashToken(code)

    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        type: 'EmailVerification',
        tokenHash,
        expiresAt: new Date(Date.now() + this.verifyEmailTtlMs()),
        createdByIp: ip,
        userAgent: ua
      }
    })

    await this.mailService.sendVerificationCode(email, code).catch((err) => {
      this.logger.error(`Failed to send verification email: ${err.message}`)
    })

    return { ok: true }
  }

  // ── Verify Email ───────────────────────────────────────────────────

  async verifyEmailRequest(input: VerifyEmailRequestInput, ip?: string, ua?: string) {
    const email = this.normalizeEmail(input.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (user && !user.emailVerifiedAt) {
      const code = this.generateCode()
      const tokenHash = this.hashToken(code)

      await this.prisma.authToken.create({
        data: {
          userId: user.id,
          type: 'EmailVerification',
          tokenHash,
          expiresAt: new Date(Date.now() + this.verifyEmailTtlMs()),
          createdByIp: ip,
          userAgent: ua
        }
      })

      await this.mailService.sendVerificationCode(email, code).catch((err) => {
        this.logger.error(`Failed to send verification email: ${err.message}`)
      })
    }

    return { ok: true }
  }

  async verifyEmailConfirm(input: VerifyEmailConfirmInput) {
    const email = this.normalizeEmail(input.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification code')
    }

    const codeHash = this.hashToken(input.code)

    const authToken = await this.prisma.authToken.findFirst({
      where: {
        userId: user.id,
        tokenHash: codeHash,
        type: 'EmailVerification',
        consumedAt: null,
        expiresAt: { gt: new Date() }
      }
    })

    if (!authToken) {
      throw new UnauthorizedException('Invalid or expired verification code')
    }

    await this.prisma.$transaction([
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { consumedAt: new Date() }
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() }
      })
    ])

    return { ok: true }
  }

  // ── Forgot / Reset Password ────────────────────────────────────────

  async forgotPassword(input: ForgotPasswordInput, ip?: string, ua?: string) {
    const email = this.normalizeEmail(input.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (user) {
      const code = this.generateCode()
      const tokenHash = this.hashToken(code)

      await this.prisma.authToken.create({
        data: {
          userId: user.id,
          type: 'PasswordReset',
          tokenHash,
          expiresAt: new Date(Date.now() + this.resetPasswordTtlMs()),
          createdByIp: ip,
          userAgent: ua
        }
      })

      await this.mailService.sendPasswordResetCode(email, code).catch((err) => {
        this.logger.error(`Failed to send password reset email: ${err.message}`)
      })
    }

    return { ok: true }
  }

  async resetPassword(input: ResetPasswordInput) {
    const email = this.normalizeEmail(input.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset code')
    }

    const codeHash = this.hashToken(input.code)

    const authToken = await this.prisma.authToken.findFirst({
      where: {
        userId: user.id,
        tokenHash: codeHash,
        type: 'PasswordReset',
        consumedAt: null,
        expiresAt: { gt: new Date() }
      }
    })

    if (!authToken) {
      throw new UnauthorizedException('Invalid or expired reset code')
    }

    const passwordHash = await argon2.hash(input.newPassword, ARGON2_OPTIONS)
    const now = new Date()

    await this.prisma.$transaction([
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { consumedAt: now }
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordChangedAt: now,
          tokenVersion: { increment: 1 }
        }
      }),
      this.prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now }
      })
    ])

    await this.mailService.sendPasswordChangedNotification(email).catch((err) => {
      this.logger.error(`Failed to send password changed notification: ${err.message}`)
    })

    return { ok: true }
  }

  // ── Change Password (authenticated) ───────────────────────────────

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const passwordValid = await this.verifyPassword(input.currentPassword, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect')
    }

    const passwordHash = await argon2.hash(input.newPassword, ARGON2_OPTIONS)
    const now = new Date()

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          passwordChangedAt: now,
          tokenVersion: { increment: 1 }
        }
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now }
      })
    ])

    await this.mailService.sendPasswordChangedNotification(user.email).catch((err) => {
      this.logger.error(`Failed to send password changed notification: ${err.message}`)
    })

    return { ok: true }
  }

  // ── Login ──────────────────────────────────────────────────────────

  async login(input: LoginInput, ip?: string, ua?: string) {
    const email = this.normalizeEmail(input.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordValid = await this.verifyPassword(input.password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email not verified')
    }

    // Migrate bcrypt hash to argon2id on successful login
    if (user.passwordHash.startsWith('$2')) {
      const newHash = await argon2.hash(input.password, ARGON2_OPTIONS)
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      })
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: '', // placeholder, updated below
        ip,
        userAgent: ua
      }
    })

    const tokens = await this.createTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      tv: user.tokenVersion,
      jti: session.id
    })

    const refreshTokenHash = this.hashToken(tokens.refreshToken)

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: session.id },
        data: { refreshTokenHash }
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    ])

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserResponse(user)
    }
  }

  // ── Refresh (with rotation + reuse detection) ──────────────────────

  async refresh(rawRefreshToken: string) {
    let payload: { sub: string; jti?: string }

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; jti?: string }>(rawRefreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        issuer: this.jwtIssuer(),
        audience: this.jwtAudience()
      })
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }

    if (!payload.jti) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    // Resolve session by jti (session id), then compare hashes
    const session = await this.prisma.session.findUnique({
      where: { id: payload.jti }
    })

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const refreshTokenHash = this.hashToken(rawRefreshToken)

    // If session exists and is not revoked but hash mismatches → reuse detected
    if (session.refreshTokenHash !== refreshTokenHash) {
      this.logger.warn(`Refresh token reuse detected for user ${payload.sub}`)
      await this.prisma.session.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() }
      })
      throw new UnauthorizedException('Invalid refresh token')
    }

    // Check session age (30 days idle, 90 days absolute)
    const now = Date.now()
    const idleLimit = 30 * 24 * 60 * 60 * 1000
    const absoluteLimit = 90 * 24 * 60 * 60 * 1000

    if (now - session.lastUsedAt.getTime() > idleLimit || now - session.createdAt.getTime() > absoluteLimit) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() }
      })
      throw new UnauthorizedException('Session expired')
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    // Rotate: create new tokens, update session hash
    const tokens = await this.createTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      tv: user.tokenVersion,
      jti: session.id
    })

    const newRefreshTokenHash = this.hashToken(tokens.refreshToken)

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        lastUsedAt: new Date()
      }
    })

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserResponse(user)
    }
  }

  // ── Invite Complete ────────────────────────────────────────────────

  async completeInvite(input: InviteCompleteInput, ip?: string, ua?: string) {
    const invitePayload = await this.verifyInviteToken(input.token)
    const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS)

    const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const activation = await tx.userLocation.updateMany({
        where: {
          userId: invitePayload.sub,
          locationId: invitePayload.locationId,
          status: 'invited'
        },
        data: { status: 'active' }
      })

      if (activation.count !== 1) {
        throw new UnauthorizedException('Invite is invalid or already used')
      }

      return tx.user.update({
        where: { id: invitePayload.sub },
        data: {
          passwordHash,
          emailVerifiedAt: new Date() // Invited users are considered verified
        },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          tokenVersion: true,
          createdAt: true,
          updatedAt: true
        }
      })
    })

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: '', // placeholder
        ip,
        userAgent: ua
      }
    })

    const tokens = await this.createTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      tv: user.tokenVersion,
      jti: session.id
    })

    const refreshTokenHash = this.hashToken(tokens.refreshToken)

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash }
    })

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserResponse(user)
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await this.prisma.session.updateMany({
        where: { id: sessionId, userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    } else {
      // Revoke all sessions for user
      await this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    }
  }

  // ── Me ─────────────────────────────────────────────────────────────

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

  // ── Cookie Options ─────────────────────────────────────────────────

  getRefreshCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.isSecureCookieEnabled(),
      path: '/auth',
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    }
  }

  // ── Private helpers ────────────────────────────────────────────────

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase().normalize('NFKC')
  }

  private generateCode(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0')
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex')
  }

  private async verifyPassword(plain: string, hash: string): Promise<boolean> {
    // Support bcrypt hashes (migration path)
    if (hash.startsWith('$2')) {
      return bcryptCompare(plain, hash)
    }

    return argon2.verify(hash, plain)
  }

  private verifyEmailTtlMs(): number {
    const minutes = parseInt(this.configService.get<string>('AUTH_VERIFY_EMAIL_TTL_MINUTES') ?? '', 10)
    return (Number.isFinite(minutes) ? minutes : DEFAULT_VERIFY_EMAIL_TTL_MINUTES) * 60 * 1000
  }

  private resetPasswordTtlMs(): number {
    const minutes = parseInt(this.configService.get<string>('AUTH_RESET_PASSWORD_TTL_MINUTES') ?? '', 10)
    return (Number.isFinite(minutes) ? minutes : DEFAULT_RESET_PASSWORD_TTL_MINUTES) * 60 * 1000
  }

  private isSecureCookieEnabled() {
    const raw = this.configService.get<string>('COOKIE_SECURE')

    if (raw !== undefined) {
      const normalized = raw.trim().toLowerCase()
      return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
    }

    return this.configService.get<string>('NODE_ENV') === 'production'
  }

  private jwtIssuer(): string {
    return this.configService.get<string>('JWT_ISSUER') ?? 'jtrack'
  }

  private jwtAudience(): string {
    return this.configService.get<string>('JWT_AUDIENCE') ?? 'jtrack'
  }

  private async createTokens(payload: {
    sub: string
    email: string
    isAdmin: boolean
    tv: number
    jti: string
  }) {
    const issuer = this.jwtIssuer()
    const audience = this.jwtAudience()

    const accessToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email, isAdmin: payload.isAdmin, tv: payload.tv, jti: payload.jti },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_ACCESS_TTL') ?? '15m') as never,
        issuer,
        audience
      }
    )

    const refreshToken = await this.jwtService.signAsync(
      { sub: payload.sub, jti: payload.jti },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_TTL') ?? '30d') as never,
        issuer,
        audience
      }
    )

    return { accessToken, refreshToken }
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
    return serializeDates({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  }
}
