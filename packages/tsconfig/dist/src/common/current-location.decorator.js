"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentLocation = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentLocation = (0, common_1.createParamDecorator)((_, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.locationId;
});
//# sourceMappingURL=current-location.decorator.js.map