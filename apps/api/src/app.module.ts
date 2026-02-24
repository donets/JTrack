import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/jwt-auth.guard'
import { PrismaModule } from './prisma/prisma.module'
import { LocationGuard } from './rbac/location.guard'
import { PrivilegesGuard } from './rbac/privileges.guard'
import { RbacModule } from './rbac/rbac.module'
import { UsersModule } from './users/users.module'
import { LocationsModule } from './locations/locations.module'
import { TicketsModule } from './tickets/tickets.module'
import { CommentsModule } from './comments/comments.module'
import { AttachmentsModule } from './attachments/attachments.module'
import { PaymentsModule } from './payments/payments.module'
import { SyncModule } from './sync/sync.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100
      }
    ]),
    PrismaModule,
    AuthModule,
    RbacModule,
    UsersModule,
    LocationsModule,
    TicketsModule,
    CommentsModule,
    AttachmentsModule,
    PaymentsModule,
    SyncModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: LocationGuard
    },
    {
      provide: APP_GUARD,
      useClass: PrivilegesGuard
    }
  ]
})
export class AppModule {}
