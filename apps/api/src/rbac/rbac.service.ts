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

    return roles.map((role) => ({
      key: role.key,
      name: role.name,
      privileges: role.rolePrivileges.map((entry) => entry.privilegeKey)
    }))
  }

  async getPrivileges() {
    const privileges = await this.prisma.privilege.findMany({
      orderBy: { key: 'asc' }
    })

    return privileges.map((privilege) => ({
      key: privilege.key,
      description: privilege.description
    }))
  }
}
