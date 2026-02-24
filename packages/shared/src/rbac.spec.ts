import { describe, expect, it } from 'vitest'
import { privilegeKeys, rolePrivileges } from './rbac.js'

describe('role privilege matrix', () => {
  it('grants full privilege set to Owner', () => {
    expect(rolePrivileges.Owner).toEqual(privilegeKeys)
  })

  it('keeps Technician scope limited', () => {
    expect(rolePrivileges.Technician).toContain('sync.run')
    expect(rolePrivileges.Technician).not.toContain('users.manage')
    expect(rolePrivileges.Technician).not.toContain('billing.manage')
  })
})
