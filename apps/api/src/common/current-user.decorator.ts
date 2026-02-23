import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { AuthenticatedRequest } from './types'

export const CurrentUser = createParamDecorator((_: never, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
  return request.user
})
