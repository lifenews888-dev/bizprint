import * as dotenv from 'dotenv';
dotenv.config({ override: true });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ErrorLoggerFilter } from './common/filters/error-logger.filter';
import { ValidationPipe } from '@nestjs/common';
import { systemLogger } from './common/logger';
import helmet from 'helmet';

async function bootstrap() {
  try { mkdirSync(join(process.cwd(), 'logs'), { recursive: true }); } catch {}

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ErrorLoggerFilter());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Version'],
    credentials: true,
  });

  // Request logger (dev only)
  if (process.env.NODE_ENV !== 'production') {
    app.use((req: any, _res: any, next: any) => {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} from ${req.ip}`);
      next();
    });
  }

  // Maintenance mode middleware
  app.use((req: any, res: any, next: any) => {
    // Skip admin/auth/cms routes
    if (req.url.startsWith('/auth') || req.url.startsWith('/system') || req.url.startsWith('/cms')) return next();
    try {
      const { SystemService } = require('./system/system.service');
      if (SystemService.isMaintenanceMode && SystemService.isMaintenanceMode()) {
        return res.status(503).json({ message: 'Систем түр засвартай байна. Удахгүй буцаж ирнэ.', maintenance: true });
      }
    } catch {}
    next();
  });

  // Static files
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 BizPrint API running on port ${port} [build: 2026-04-06T09]`);

  // Self-healing: memory check every 60s
  setInterval(() => {
    const mem = process.memoryUsage();
    const heapPct = Math.round((mem.heapUsed / mem.heapTotal) * 100);
    if (heapPct > 90) {
      systemLogger.warn('High memory usage', { heapPct });
      if (global.gc) global.gc();
    }
  }, 60_000);

  // Uncaught exception handler
  process.on('uncaughtException', (err) => {
    systemLogger.error('Uncaught Exception', { message: err.message, stack: err.stack });
    const { SystemService } = require('./system/system.service');
    SystemService.logError({ level: 'fatal', message: err.message, stack: err.stack?.slice(0, 2000) });
  });

  process.on('unhandledRejection', (reason: any) => {
    systemLogger.error('Unhandled Rejection', { message: reason?.message || String(reason) });
  });

  console.log(`BizPrint API running on http://0.0.0.0:${port}`);
}
bootstrap();

