import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePrivileges: {
          include: {
            privilege: true
          }
        }
      },
      orderBy: { key: 'asc' }
    })

    return roles.map((role: (typeof roles)[number]) => ({
      key: role.key,
      name: role.name,
      privileges: role.rolePrivileges.map((entry: (typeof role.rolePrivileges)[number]) => entry.privilegeKey)
    }))
  }

  async getPrivileges() {
    const privileges = await this.prisma.privilege.findMany({
      orderBy: { key: 'asc' }
    })

    return privileges.map((privilege: (typeof privileges)[number]) => ({
      key: privilege.key,
      description: privilege.description
    }))
  }
}
