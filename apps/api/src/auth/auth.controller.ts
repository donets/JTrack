import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes
} from '@nestjs/common'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { loginInputSchema } from '@jtrack/shared'
import { CurrentUser } from '@/common/current-user.decorator'
import type { JwtUser } from '@/common/types'
import { ZodValidationPipe } from '@/common/zod-validation.pipe'
import { SkipLocationGuard } from '@/rbac/skip-location.decorator'
import { Public } from './public.decorator'
import { AuthService } from './auth.service'

@SkipLocationGuard()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      ttl: 60_000,
      limit: 10
    }
  })
  @UsePipes(new ZodValidationPipe(loginInputSchema))
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.login(body)

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
  @Throttle({
    default: {
      ttl: 60_000,
      limit: 10
    }
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: { refreshToken?: string }
  ) {
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

  @Post('logout')
  async logout(
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logout(user.sub)
    response.clearCookie('refresh_token', this.authService.getRefreshCookieOptions())
    return { ok: true }
  }

  @Get('me')
  async me(@CurrentUser() user: JwtUser) {
    return this.authService.me(user.sub)
  }
}
