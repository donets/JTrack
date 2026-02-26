import type { RoleKey } from '@jtrack/shared'
import type { Request } from 'express'

export interface JwtUser {
  sub: string
  email: string
  isAdmin: boolean
  jti?: string
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUser
  locationId?: string
  locationRole?: RoleKey
}
