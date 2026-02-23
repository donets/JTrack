import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { AuthenticatedRequest } from './types'

export const CurrentLocation = createParamDecorator((_: never, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
  return request.locationId
})
