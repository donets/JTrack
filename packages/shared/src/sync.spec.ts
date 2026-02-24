import { describe, expect, it } from 'vitest'
import { syncPullResponseSchema, syncPushRequestSchema } from './sync.js'

describe('sync schemas', () => {
  it('accepts valid push payload', () => {
    const parsed = syncPushRequestSchema.parse({
      locationId: 'loc-1',
      lastPulledAt: 1_700_000_000_000,
      clientId: 'client-1',
      changes: {
        tickets: { created: [], updated: [], deleted: [] },
        ticketComments: { created: [], updated: [], deleted: [] },
        ticketAttachments: { created: [], updated: [], deleted: [] },
        paymentRecords: { created: [], updated: [], deleted: [] }
      }
    })

    expect(parsed.clientId).toBe('client-1')
    expect(parsed.locationId).toBe('loc-1')
  })

  it('rejects pull response with invalid timestamp', () => {
    expect(() =>
      syncPullResponseSchema.parse({
        changes: {
          tickets: { created: [], updated: [], deleted: [] },
          ticketComments: { created: [], updated: [], deleted: [] },
          ticketAttachments: { created: [], updated: [], deleted: [] },
          paymentRecords: { created: [], updated: [], deleted: [] }
        },
        timestamp: 1.25
      })
    ).toThrow()
  })
})
