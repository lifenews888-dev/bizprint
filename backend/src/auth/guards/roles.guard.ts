import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — @Roles() decorator-тэй хамт ажиллана
 *
 * Жишээ:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('admin', 'vendor')
 *   @Get('vendors')
 *   getVendors() {}
 *
 * @Roles() тавиагүй бол бүх role нэвтэрнэ (JwtAuthGuard шалгасан л бол)
 * 'admin' ба 'superadmin' нь бүх route-д автоматаар нэвтэрнэ
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → allow all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Нэвтрээгүй байна');

    const userRole = user.role;

    // Admin/superadmin always pass
    if (userRole === 'admin' || userRole === 'superadmin') return true;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `"${userRole}" эрхтэй хэрэглэгч хандах боломжгүй. Шаардлагатай: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
