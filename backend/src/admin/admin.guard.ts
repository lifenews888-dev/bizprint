import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * AdminGuard — зөвхөн admin/superadmin role шалгана
 * Backward compatible: @UseGuards(JwtAuthGuard, AdminGuard) хэвээрээ ажиллана
 *
 * Шинэ код бичихдээ RolesGuard + @Roles('admin') ашиглана уу:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('admin')
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Нэвтрээгүй байна');
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      throw new ForbiddenException('Зөвхөн админ хандах боломжтой');
    }

    return true;
  }
}
