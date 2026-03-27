import { SetMetadata } from '@nestjs/common';

/**
 * @Roles('admin', 'vendor') — зөвхөн эдгээр role-тэй хэрэглэгч хандах боломжтой
 * JwtAuthGuard-тай хамт ашиглана:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('admin', 'vendor')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
