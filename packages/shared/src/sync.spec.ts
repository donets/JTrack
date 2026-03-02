import { describe, expect, it } from 'vitest'
import { syncPullRequestSchema, syncPullResponseSchema, syncPushRequestSchema } from './sync.js'

describe('sync schemas', () => {
  it('accepts valid push payload', () => {
    const parsed = syncPushRequestSchema.parse({
      locationId: 'loc-1',
      lastPulledAt: 1_700_000_000_000,
      clientId: 'client-1',
      changes: {
        tickets: { created: [], updated: [], deleted: [] },
        ticketActivities: { created: [], updated: [], deleted: [] },
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
          ticketActivities: { created: [], updated: [], deleted: [] },
          ticketComments: { created: [], updated: [], deleted: [] },
          ticketAttachments: { created: [], updated: [], deleted: [] },
          paymentRecords: { created: [], updated: [], deleted: [] }
        },
        timestamp: 1.25
      })
    ).toThrow()
  })

  it('applies defaults for pull pagination fields', () => {
    const parsed = syncPullRequestSchema.parse({
      locationId: 'loc-1',
      lastPulledAt: 1_700_000_000_000
    })

    expect(parsed.limit).toBe(100)
    expect(parsed.cursor).toBeNull()
  })

  it('accepts pull response with pagination cursor', () => {
    const parsed = syncPullResponseSchema.parse({
      changes: {
        tickets: { created: [], updated: [], deleted: [] },
        ticketActivities: { created: [], updated: [], deleted: [] },
        ticketComments: { created: [], updated: [], deleted: [] },
        ticketAttachments: { created: [], updated: [], deleted: [] },
        paymentRecords: { created: [], updated: [], deleted: [] }
      },
      timestamp: 1_700_000_000_100,
      hasMore: true,
      nextCursor: {
        snapshotAt: 1_700_000_000_100,
        ticketsOffset: 10,
        ticketActivitiesOffset: 0,
        ticketCommentsOffset: 2,
        ticketAttachmentsOffset: 1,
        paymentRecordsOffset: 0
      }
    })

    expect(parsed.hasMore).toBe(true)
    expect(parsed.nextCursor?.ticketsOffset).toBe(10)
  })
})
