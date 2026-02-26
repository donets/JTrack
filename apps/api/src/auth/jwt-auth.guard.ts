import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '@/prisma/prisma.service'
import { IS_PUBLIC_KEY } from './public.decorator'
import type { AuthenticatedRequest } from '@/common/types'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing access token')
    }

    const token = authHeader.slice('Bearer '.length)

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string
        tv?: number
        iat?: number
        jti?: string
      }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        issuer: this.configService.get<string>('JWT_ISSUER') ?? 'jtrack',
        audience: this.configService.get<string>('JWT_AUDIENCE') ?? 'jtrack'
      })

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          isAdmin: true,
          tokenVersion: true,
          passwordChangedAt: true
        }
      })

      if (!user) {
        throw new UnauthorizedException('User does not exist')
      }

      // Reject if tokenVersion doesn't match (password reset, manual revoke)
      if (payload.tv !== undefined && payload.tv !== user.tokenVersion) {
        throw new UnauthorizedException('Token has been revoked')
      }

      // Reject if token was issued before password was changed
      if (user.passwordChangedAt && payload.iat) {
        const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000)
        if (payload.iat < changedAtSec) {
          throw new UnauthorizedException('Token issued before password change')
        }
      }

      request.user = {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        jti: payload.jti
      }

      return true
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err
      }
      throw new UnauthorizedException('Invalid access token')
    }
  }
}
