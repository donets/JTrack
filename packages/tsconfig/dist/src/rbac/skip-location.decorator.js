"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipLocationGuard = exports.SKIP_LOCATION_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.SKIP_LOCATION_KEY = 'skipLocation';
const SkipLocationGuard = () => (0, common_1.SetMetadata)(exports.SKIP_LOCATION_KEY, true);
exports.SkipLocationGuard = SkipLocationGuard;
//# sourceMappingURL=skip-location.decorator.js.map