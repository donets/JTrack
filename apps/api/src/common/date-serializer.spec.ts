import { describe, expect, it } from 'vitest'
import { serializeDates } from './date-serializer'

describe('serializeDates', () => {
  it('serializes nested dates in objects and arrays', () => {
    const createdAt = new Date('2026-02-25T08:00:00.000Z')
    const updatedAt = new Date('2026-02-25T09:00:00.000Z')
    const deletedAt = new Date('2026-02-25T10:00:00.000Z')

    const input = {
      createdAt,
      nested: {
        updatedAt,
        items: [{ deletedAt }, { deletedAt: null }]
      }
    }

    expect(serializeDates(input)).toEqual({
      createdAt: '2026-02-25T08:00:00.000Z',
      nested: {
        updatedAt: '2026-02-25T09:00:00.000Z',
        items: [{ deletedAt: '2026-02-25T10:00:00.000Z' }, { deletedAt: null }]
      }
    })
  })

  it('returns primitives as is', () => {
    expect(serializeDates('value')).toBe('value')
    expect(serializeDates(42)).toBe(42)
    expect(serializeDates(null)).toBeNull()
  })
})
