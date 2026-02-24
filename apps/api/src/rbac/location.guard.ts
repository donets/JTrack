import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '@/prisma/prisma.service'
import { IS_PUBLIC_KEY } from '@/auth/public.decorator'
import { SKIP_LOCATION_KEY } from './skip-location.decorator'
import type { AuthenticatedRequest } from '@/common/types'

@Injectable()
export class LocationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    const skipLocation = this.reflector.getAllAndOverride<boolean>(SKIP_LOCATION_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic || skipLocation) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.user) {
      throw new ForbiddenException('Authentication required')
    }

    const headerValue = request.headers['x-location-id']
    const locationId = Array.isArray(headerValue) ? headerValue[0] : headerValue

    if (!locationId) {
      throw new BadRequestException('Missing x-location-id header')
    }

    request.locationId = locationId

    if (request.user.isAdmin) {
      request.locationRole = 'Owner'
      return true
    }

    const membership = await this.prisma.userLocation.findUnique({
      where: {
        userId_locationId: {
          userId: request.user.sub,
          locationId
        }
      }
    })

    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('User is not a member of this location')
    }

    request.locationRole = membership.role

    return true
  }
}
