import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { RoleKey } from '@jtrack/shared'
import type { AuthenticatedRequest } from './types'

export const CurrentLocationRole = createParamDecorator(
  (_: never, ctx: ExecutionContext): RoleKey => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    return request.locationRole ?? 'Technician'
  }
)
