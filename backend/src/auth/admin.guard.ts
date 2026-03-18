import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Нэвтрээгүй байна');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('Зөвхөн админ хандах боломжтой');
    }

    return true;
  }
}