import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
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
    if (!origin) return

    const allowed = this.configService.get<string>('WEB_ORIGIN')
    if (!allowed) return

    const allowedOrigins = allowed.split(',').map((o) => o.trim())
    if (!allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Origin not allowed')
    }
  }

  @Public()
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  async register(
    @Body(new ZodValidationPipe(registerInputSchema))
    body: { email: string; name: string; password: string; locationName: string; timezone: string; address?: string },
    @Req() request: Request
  ) {
    return this.authService.register(body, request.ip, request.headers['user-agent'])
  }

  @Public()
  @Post('verify-email/request')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  async verifyEmailRequest(
    @Body(new ZodValidationPipe(verifyEmailRequestInputSchema)) body: { email: string },
    @Req() request: Request
  ) {
    return this.authService.verifyEmailRequest(body, request.ip, request.headers['user-agent'])
  }

  @Public()
  @Post('verify-email/confirm')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  async verifyEmailConfirm(
    @Body(new ZodValidationPipe(verifyEmailConfirmInputSchema)) body: { email: string; code: string }
  ) {
    return this.authService.verifyEmailConfirm(body)
  }

  @Public()
  @Post('password/forgot')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 3_600_000, limit: 3 } })
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordInputSchema)) body: { email: string },
    @Req() request: Request
  ) {
    return this.authService.forgotPassword(body, request.ip, request.headers['user-agent'])
  }

  @Public()
  @Post('password/reset')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordInputSchema))
    body: { email: string; code: string; newPassword: string }
  ) {
    return this.authService.resetPassword(body)
  }

  @Post('password/change')
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(changePasswordInputSchema))
    body: { currentPassword: string; newPassword: string }
  ) {
    return this.authService.changePassword(user.sub, body)
  }

  @Public()
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  async login(
    @Body(new ZodValidationPipe(loginInputSchema)) body: { email: string; password: string },
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

  @Public()
  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body(new ZodValidationPipe(refreshInputSchema)) body: RefreshInput
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

  @Public()
  @Post('invite/complete')
  async completeInvite(
    @Body(new ZodValidationPipe(inviteCompleteInputSchema)) body: { token: string; password: string },
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

  @Get('me')
  async me(@CurrentUser() user: JwtUser) {
    return this.authService.me(user.sub)
  }
}
