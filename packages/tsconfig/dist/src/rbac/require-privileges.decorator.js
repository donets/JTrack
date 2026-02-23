"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePrivileges = exports.REQUIRE_PRIVILEGES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRE_PRIVILEGES_KEY = 'requiredPrivileges';
const RequirePrivileges = (privileges) => (0, common_1.SetMetadata)(exports.REQUIRE_PRIVILEGES_KEY, privileges);
exports.RequirePrivileges = RequirePrivileges;
//# sourceMappingURL=require-privileges.decorator.js.map