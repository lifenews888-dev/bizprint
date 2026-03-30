import * as dotenv from 'dotenv';
dotenv.config({ override: true });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ErrorLoggerFilter, setSocketServer } from './common/filters/error-logger.filter';
import { systemLogger } from './common/logger';

async function bootstrap() {
  // Ensure logs directory exists
  try { mkdirSync(join(process.cwd(), 'logs'), { recursive: true }); } catch {}

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ErrorLoggerFilter());

  // CORS
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : true;

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

  // Static files
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  // Setup Socket.IO for admin error push
  const server = app.getHttpServer();
  try {
    const { Server } = require('socket.io');
    const io = new Server(server, { cors: { origin: '*' } });

    io.of('/admin').on('connection', (socket: any) => {
      socket.join('admin');
      console.log('Admin socket connected:', socket.id);
    });

    setSocketServer(io.of('/admin'));
    console.log('Admin WebSocket ready on /admin namespace');
  } catch (e) {
    console.warn('Socket.IO not available for admin push');
  }

  // Self-healing: memory check every 60s
  setInterval(() => {
    const mem = process.memoryUsage();
    const usedMB = Math.round(mem.rss / 1048576);
    const heapPct = Math.round((mem.heapUsed / mem.heapTotal) * 100);

    if (heapPct > 90) {
      systemLogger.warn('High memory usage detected, triggering GC hint', { heapPct, usedMB });
      if (global.gc) {
        global.gc();
        systemLogger.info('Manual GC triggered');
      }
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
