"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const prisma_module_1 = require("./prisma/prisma.module");
const location_guard_1 = require("./rbac/location.guard");
const privileges_guard_1 = require("./rbac/privileges.guard");
const rbac_module_1 = require("./rbac/rbac.module");
const users_module_1 = require("./users/users.module");
const locations_module_1 = require("./locations/locations.module");
const tickets_module_1 = require("./tickets/tickets.module");
const comments_module_1 = require("./comments/comments.module");
const attachments_module_1 = require("./attachments/attachments.module");
const payments_module_1 = require("./payments/payments.module");
const sync_module_1 = require("./sync/sync.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            rbac_module_1.RbacModule,
            users_module_1.UsersModule,
            locations_module_1.LocationsModule,
            tickets_module_1.TicketsModule,
            comments_module_1.CommentsModule,
            attachments_module_1.AttachmentsModule,
            payments_module_1.PaymentsModule,
            sync_module_1.SyncModule
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard
            },
            {
                provide: core_1.APP_GUARD,
                useClass: location_guard_1.LocationGuard
            },
            {
                provide: core_1.APP_GUARD,
                useClass: privileges_guard_1.PrivilegesGuard
            }
        ]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map