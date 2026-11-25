import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * n8n (сервер-сервер) дуудлагыг FLOW_API_TOKEN-оор шалгана.
 * Token тохируулаагүй бол бүх хүсэлтийг хаана (нээлттэй endpoint үлдээхгүй).
 */
@Injectable()
export class FlowTokenGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const expected = process.env.FLOW_API_TOKEN || '';
    if (expected.length < 16)
      throw new ServiceUnavailableException('FLOW_API_TOKEN тохируулаагүй');

    const header = String(
      ctx.switchToHttp().getRequest<{ headers?: Record<string, string> }>()
        .headers?.authorization || '',
    );
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new UnauthorizedException();
    return true;
  }
}
