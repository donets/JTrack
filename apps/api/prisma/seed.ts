import { PrismaClient } from '@prisma/client'
import { roleKeys, rolePrivileges } from '@jtrack/shared'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function syncRolesAndPrivileges() {
  for (const role of roleKeys) {
    await prisma.role.upsert({
      where: { key: role },
      update: { name: role },
      create: { key: role, name: role }
    })
  }

  const privilegeSet = new Set(Object.values(rolePrivileges).flat())

  for (const privilegeKey of privilegeSet) {
    await prisma.privilege.upsert({
      where: { key: privilegeKey },
      update: {},
      create: {
        key: privilegeKey,
        description: privilegeKey
      }
    })
  }

  for (const role of roleKeys) {
    await prisma.rolePrivilege.deleteMany({ where: { roleKey: role } })

    await prisma.rolePrivilege.createMany({
      data: rolePrivileges[role].map((privilegeKey) => ({
        roleKey: role,
        privilegeKey
      })),
      skipDuplicates: true
    })
  }
}

async function seedDemoData() {
  const argon2Options = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  } as const

  const adminPasswordHash = await argon2.hash('password123', argon2Options)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jtrack.local' },
    update: {
      name: 'JTrack Internal Admin',
      isAdmin: true,
      passwordHash: adminPasswordHash,
      emailVerifiedAt: new Date()
    },
    create: {
      email: 'admin@jtrack.local',
      name: 'JTrack Internal Admin',
      isAdmin: true,
      passwordHash: adminPasswordHash,
      emailVerifiedAt: new Date()
    }
  })

  const ownerPasswordHash = await argon2.hash('password123', argon2Options)

  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@demo.local' },
    update: {
      name: 'Demo Owner',
      isAdmin: false,
      passwordHash: ownerPasswordHash,
      emailVerifiedAt: new Date()
    },
    create: {
      email: 'owner@demo.local',
      name: 'Demo Owner',
      isAdmin: false,
      passwordHash: ownerPasswordHash,
      emailVerifiedAt: new Date()
    }
  })

  const location = await prisma.location.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {
      name: 'Demo Service Area',
      timezone: 'Europe/Berlin',
      address: 'Mainstrasse 10'
    },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Demo Service Area',
      timezone: 'Europe/Berlin',
      address: 'Mainstrasse 10'
    }
  })

  await prisma.userLocation.upsert({
    where: {
      userId_locationId: {
        userId: ownerUser.id,
        locationId: location.id
      }
    },
    update: {
      role: 'Owner',
      status: 'active'
    },
    create: {
      userId: ownerUser.id,
      locationId: location.id,
      role: 'Owner',
      status: 'active'
    }
  })

  await prisma.ticket.upsert({
    where: { id: '22222222-2222-2222-2222-222222222221' },
    update: {
      title: 'Boiler inspection',
      ticketNumber: 1,
      status: 'Scheduled',
      assignedToUserId: ownerUser.id,
      locationId: location.id,
      createdByUserId: ownerUser.id
    },
    create: {
      id: '22222222-2222-2222-2222-222222222221',
      title: 'Boiler inspection',
      ticketNumber: 1,
      description: 'Quarterly maintenance visit',
      status: 'Scheduled',
      scheduledStartAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      scheduledEndAt: new Date(Date.now() + 1000 * 60 * 60 * 26),
      priority: 'high',
      locationId: location.id,
      createdByUserId: ownerUser.id,
      assignedToUserId: ownerUser.id
    }
  })

  await prisma.ticket.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {
      title: 'AC not cooling',
      ticketNumber: 2,
      status: 'New',
      locationId: location.id,
      createdByUserId: ownerUser.id
    },
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'AC not cooling',
      ticketNumber: 2,
      description: 'Customer reports warm air only',
      status: 'New',
      priority: 'medium',
      locationId: location.id,
      createdByUserId: ownerUser.id
    }
  })

  await prisma.userLocation.upsert({
    where: {
      userId_locationId: {
        userId: adminUser.id,
        locationId: location.id
      }
    },
    update: {
      role: 'Manager',
      status: 'active'
    },
    create: {
      userId: adminUser.id,
      locationId: location.id,
      role: 'Manager',
      status: 'active'
    }
  })
}

async function main() {
  await syncRolesAndPrivileges()
  await seedDemoData()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
