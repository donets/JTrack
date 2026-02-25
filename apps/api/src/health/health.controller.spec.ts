import { describe, expect, it } from 'vitest'
import { IS_PUBLIC_KEY } from '@/auth/public.decorator'
import { HealthController } from './health.controller'

describe('HealthController', () => {
  it('exposes health endpoint as public route', () => {
    const checkMethod = Object.getOwnPropertyDescriptor(HealthController.prototype, 'check')?.value

    expect(checkMethod).toBeTypeOf('function')
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, checkMethod)).toBe(true)
  })
})
