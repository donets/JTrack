import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { resolve } from 'node:path'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.use(cookieParser())

  const corsOrigin = process.env.WEB_ORIGIN?.split(',').map((item) => item.trim())

  if (!corsOrigin && process.env.NODE_ENV !== 'development') {
    throw new Error('WEB_ORIGIN must be set in non-development environments')
  }

  app.enableCors({
    origin: corsOrigin ?? true,
    credentials: true,
    allowedHeaders: ['content-type', 'authorization', 'x-location-id']
  })

  const uploadDir = resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads')
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads'
  })

  const port = Number(process.env.API_PORT ?? '3001')
  await app.listen(port)
  console.log(`API listening on http://localhost:${port}`)
}

bootstrap().catch((error) => {
  console.error(error)
  process.exit(1)
})
