import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import {
  changePasswordInputSchema,
  forgotPasswordInputSchema,
  inviteCompleteInputSchema,
  loginInputSchema,
  refreshInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
  verifyEmailConfirmInputSchema,
  verifyEmailRequestInputSchema,
  type RefreshInput
} from '@jtrack/shared'
import { CurrentUser } from '@/common/current-user.decorator'
import type { JwtUser } from '@/common/types'
import { ZodValidationPipe } from '@/common/zod-validation.pipe'
import { SkipLocationGuard } from '@/rbac/skip-location.decorator'
import { Public } from './public.decorator'
import { AuthService } from './auth.service'

@SkipLocationGuard()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  private validateOrigin(request: Request): void {
    const origin = request.headers.origin
    if (!origin) return // no Origin header (e.g. same-origin navigation) — allow

    const allowed = this.configService.get<string>('WEB_ORIGIN')
    if (!allowed) return // not configured — skip validation

    const allowedOrigins = allowed.split(',').map((o) => o.trim())
    if (!allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Origin not allowed')
    }
  }

  // ── Register ───────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  @UsePipes(new ZodValidationPipe(registerInputSchema))
  async register(
    @Body() body: { email: string; name: string; password: string; locationName: string; timezone: string; address?: string },
    @Req() request: Request
  ) {
    return this.authService.register(body, request.ip, request.headers['user-agent'])
  }

  // ── Verify Email ───────────────────────────────────────────────────

  @Public()
  @Post('verify-email/request')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  @UsePipes(new ZodValidationPipe(verifyEmailRequestInputSchema))
  async verifyEmailRequest(
    @Body() body: { email: string },
    @Req() request: Request
  ) {
    return this.authService.verifyEmailRequest(body, request.ip, request.headers['user-agent'])
  }

  @Public()
  @Post('verify-email/confirm')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  @UsePipes(new ZodValidationPipe(verifyEmailConfirmInputSchema))
  async verifyEmailConfirm(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmailConfirm(body)
  }

  // ── Forgot / Reset Password ────────────────────────────────────────

  @Public()
  @Post('password/forgot')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 3_600_000, limit: 3 } })
  @UsePipes(new ZodValidationPipe(forgotPasswordInputSchema))
  async forgotPassword(
    @Body() body: { email: string },
    @Req() request: Request
  ) {
    return this.authService.forgotPassword(body, request.ip, request.headers['user-agent'])
  }

  @Public()
  @Post('password/reset')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  @UsePipes(new ZodValidationPipe(resetPasswordInputSchema))
  async resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    return this.authService.resetPassword(body)
  }

  // ── Change Password (authenticated) ───────────────────────────────

  @Post('password/change')
  @UsePipes(new ZodValidationPipe(changePasswordInputSchema))
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    return this.authService.changePassword(user.sub, body)
  }

  // ── Login ──────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  @UsePipes(new ZodValidationPipe(loginInputSchema))
  async login(
    @Body() body: { email: string; password: string },
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.login(body, request.ip, request.headers['user-agent'])

    response.cookie(
      'refresh_token',
      result.refreshToken,
      this.authService.getRefreshCookieOptions()
    )

    return {
      accessToken: result.accessToken,
      user: result.user
    }
  }

  // ── Refresh ────────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UsePipes(new ZodValidationPipe(refreshInputSchema))
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: RefreshInput
  ) {
    this.validateOrigin(request)
    const refreshToken = request.cookies?.refresh_token ?? body?.refreshToken

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token')
    }

    const result = await this.authService.refresh(refreshToken)

    response.cookie(
      'refresh_token',
      result.refreshToken,
      this.authService.getRefreshCookieOptions()
    )

    return {
      accessToken: result.accessToken,
      user: result.user
    }
  }

  // ── Invite Complete ────────────────────────────────────────────────

  @Public()
  @Post('invite/complete')
  @UsePipes(new ZodValidationPipe(inviteCompleteInputSchema))
  async completeInvite(
    @Body() body: { token: string; password: string },
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.completeInvite(body, request.ip, request.headers['user-agent'])

    response.cookie(
      'refresh_token',
      result.refreshToken,
      this.authService.getRefreshCookieOptions()
    )

    return {
      accessToken: result.accessToken,
      user: result.user
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────

  @Post('logout')
  async logout(
    @CurrentUser() user: JwtUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    this.validateOrigin(request)
    await this.authService.logout(user.sub, user.jti)
    response.clearCookie('refresh_token', this.authService.getRefreshCookieOptions())
    return { ok: true }
  }

  // ── Me ─────────────────────────────────────────────────────────────

  @Get('me')
  async me(@CurrentUser() user: JwtUser) {
    return this.authService.me(user.sub)
  }
}
