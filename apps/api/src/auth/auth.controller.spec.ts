import { GUARDS_METADATA } from '@nestjs/common/constants'
import { ThrottlerGuard } from '@nestjs/throttler'
import { describe, expect, it } from 'vitest'
import { AuthController } from './auth.controller'

const getMethod = (name: keyof AuthController) =>
  Object.getOwnPropertyDescriptor(AuthController.prototype, name)?.value

describe('AuthController throttling', () => {
  it('applies throttler guard to login endpoint', () => {
    const loginMethod = getMethod('login')
    expect(loginMethod).toBeTypeOf('function')

    expect(Reflect.getMetadata(GUARDS_METADATA, loginMethod)).toContain(ThrottlerGuard)
  })

  it('applies throttler guard to refresh endpoint only', () => {
    const refreshMethod = getMethod('refresh')
    expect(refreshMethod).toBeTypeOf('function')
    expect(Reflect.getMetadata(GUARDS_METADATA, refreshMethod)).toContain(ThrottlerGuard)

    const logoutMethod = getMethod('logout')
    expect(logoutMethod).toBeTypeOf('function')
    expect(Reflect.getMetadata(GUARDS_METADATA, logoutMethod) ?? []).not.toContain(ThrottlerGuard)
  })
})
