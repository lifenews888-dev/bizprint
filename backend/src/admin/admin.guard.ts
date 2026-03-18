import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token байхгүй байна');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'bizprint_super_secret_key_2026') as any;
      req['user'] = payload;

      if (payload.role !== 'admin') {
        throw new UnauthorizedException('Зөвхөн админ хандах эрхтэй');
      }

      return true;
    } catch {
      throw new UnauthorizedException('Token буруу байна');
    }
  }
}