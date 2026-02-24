import { describe, expect, it } from 'vitest'
import { inviteCompleteInputSchema, inviteResponseSchema } from './schemas.js'

describe('shared schemas', () => {
  it('validates invite completion payload', () => {
    const parsed = inviteCompleteInputSchema.parse({
      token: 'invite-token',
      password: 'StrongPass123!'
    })

    expect(parsed.token).toBe('invite-token')
  })

  it('rejects malformed invite completion payload', () => {
    expect(() =>
      inviteCompleteInputSchema.parse({
        token: '',
        password: 'short'
      })
    ).toThrow()
  })

  it('requires onboarding fields in invite response', () => {
    expect(() =>
      inviteResponseSchema.parse({
        ok: true,
        userId: 'user-1',
        status: 'invited'
      })
    ).toThrow()
  })
})
