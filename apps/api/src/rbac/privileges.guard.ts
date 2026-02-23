import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { PrivilegeKey, RoleKey } from '@jtrack/shared'
import { rolePrivileges } from '@jtrack/shared'
import { PrismaService } from '@/prisma/prisma.service'
import type { AuthenticatedRequest } from '@/common/types'
import { IS_PUBLIC_KEY } from '@/auth/public.decorator'
import { REQUIRE_PRIVILEGES_KEY } from './require-privileges.decorator'

@Injectable()
export class PrivilegesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
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

    const requiredPrivileges =
      this.reflector.getAllAndOverride<PrivilegeKey[]>(REQUIRE_PRIVILEGES_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? []

    if (requiredPrivileges.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.user) {
      throw new ForbiddenException('Authentication required')
    }

    if (request.user.isAdmin) {
      return true
    }

    if (!request.locationId) {
      throw new ForbiddenException('Location context is required')
    }

    let role: RoleKey | undefined = request.locationRole

    if (!role) {
      const membership = await this.prisma.userLocation.findUnique({
        where: {
          userId_locationId: {
            userId: request.user.sub,
            locationId: request.locationId
          }
        }
      })

      if (!membership || membership.status !== 'active') {
        throw new ForbiddenException('No active membership found')
      }

      role = membership.role as RoleKey
      request.locationRole = role
    }

    const grantedPrivileges = new Set(rolePrivileges[role])
    const missingPrivileges = requiredPrivileges.filter((privilege) => !grantedPrivileges.has(privilege))

    if (missingPrivileges.length > 0) {
      throw new ForbiddenException(
        `Missing privileges: ${missingPrivileges.join(', ')}`
      )
    }

    return true
  }
}
