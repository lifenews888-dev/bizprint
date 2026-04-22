import * as dotenv from 'dotenv';
dotenv.config({ override: true });

// In production, silence stray console.log/info/debug from legacy code paths
// so customer data, payment details and verbose object dumps don't leak into
// container logs. Errors and warnings still go through. Use NestJS Logger or
// the structured `systemLogger` for anything you actually want to keep.
if (process.env.NODE_ENV === 'production') {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
}

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

  // Production safety: refuse to start with insecure / sandbox credentials.
  // Each fatal mistake in payment config can drain real customer money.
  if (process.env.NODE_ENV === 'production') {
    const fatal: string[] = []

    const bonumBase = process.env.BONUM_API_BASE || ''
    if (!bonumBase) fatal.push('BONUM_API_BASE not set')
    else if (bonumBase.includes('testapi')) fatal.push('BONUM_API_BASE points at sandbox (testapi.bonum.mn)')
    if (!process.env.BONUM_APP_SECRET) fatal.push('BONUM_APP_SECRET not set')
    if (!process.env.BONUM_TERMINAL_ID) fatal.push('BONUM_TERMINAL_ID not set')
    if (!process.env.BONUM_CHECKSUM_KEY) fatal.push('BONUM_CHECKSUM_KEY not set (webhook would be unverified)')

    const tdbOauth = process.env.TDB_OAUTH_URL || ''
    if (tdbOauth.includes('sandbox')) fatal.push('TDB_OAUTH_URL points at sandbox')
    if (!process.env.TDB_CLIENT_ID) fatal.push('TDB_CLIENT_ID not set')
    if (!process.env.TDB_CLIENT_SECRET) fatal.push('TDB_CLIENT_SECRET not set')

    if (!process.env.CORS_ORIGINS) fatal.push('CORS_ORIGINS not set (would default to localhost)')

    if (fatal.length) {
      console.error('❌ FATAL: refusing to start in production with insecure config:')
      fatal.forEach(m => console.error('   - ' + m))
      process.exit(1)
    }
  } else {
    // Dev mode — just warn
    if (!process.env.BONUM_APP_SECRET) console.warn('⚠️  BONUM_APP_SECRET not set — Bonum payments will fail')
    if (!process.env.BONUM_CHECKSUM_KEY) console.warn('⚠️  BONUM_CHECKSUM_KEY not set — webhook signatures will not be verified')
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CSP — strict in production, permissive in dev so the Next.js HMR /
  // chat widget / inline analytics scripts don't choke. The frontend lives
  // on a separate origin so we don't need our own scripts to be inline; we
  // do allow inline styles for dynamic colour tokens, and Cloudinary +
  // payment provider hosts for images and iframes.
  const isProd = process.env.NODE_ENV === 'production'
  app.use(helmet({
    contentSecurityPolicy: isProd ? {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https:'],
        connectSrc: ["'self'", 'https://api.bonum.mn', 'https://api.tdbmlabs.mn', 'wss:', 'https:'],
        frameSrc: ["'self'", 'https://*.bonum.mn', 'https://*.tdbmlabs.mn', 'https://zoom.us'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
  }));
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

