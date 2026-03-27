import * as dotenv from 'dotenv';
dotenv.config({ override: true });   // Windows env empty-string override fix

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: true,  // Allow all origins in dev (mobile apps use device IP)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Version'],
    credentials: true,
  });

  // Request logger — бүх хүсэлтийг лог хийнэ
  app.use((req: any, _res: any, next: any) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} from ${req.ip}`);
    next();
  });

  // Serve uploaded files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(4000, '0.0.0.0');
  console.log('BizPrint API running on http://0.0.0.0:4000');
}
bootstrap();
