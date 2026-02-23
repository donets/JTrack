"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_path_1 = require("node:path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: process.env.WEB_ORIGIN?.split(',').map((item) => item.trim()) ?? true,
        credentials: true,
        allowedHeaders: ['content-type', 'authorization', 'x-location-id']
    });
    const uploadDir = (0, node_path_1.resolve)(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');
    app.useStaticAssets(uploadDir, {
        prefix: '/uploads'
    });
    const port = Number(process.env.API_PORT ?? '3001');
    await app.listen(port);
    console.log(`API listening on http://localhost:${port}`);
}
bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map