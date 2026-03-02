import { describe, expect, it } from 'vitest'
import {
  listAllowedStatusTransitions,
  validateStatusTransition
} from './ticket-status-transitions.js'

describe('ticket status transitions', () => {
  it('allows only limited technician transitions', () => {
    expect(validateStatusTransition('New', 'InProgress', 'Technician').valid).toBe(true)
    expect(validateStatusTransition('New', 'Done', 'Technician').valid).toBe(false)
  })

  it('blocks paid transitions for manager', () => {
    const result = validateStatusTransition('Invoiced', 'Paid', 'Manager')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('system payment workflow')
  })

  it('allows cancel from any non-paid status', () => {
    expect(validateStatusTransition('New', 'Canceled', 'Technician').valid).toBe(true)
    expect(validateStatusTransition('InProgress', 'Canceled', 'Manager').valid).toBe(true)
    expect(validateStatusTransition('Paid', 'Canceled', 'Owner').valid).toBe(false)
  })

  it('exposes allowed transitions list for ui', () => {
    expect(listAllowedStatusTransitions('Scheduled', 'Technician')).toEqual(['InProgress', 'Canceled'])
  })
})
