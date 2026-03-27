import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Optional JWT guard — never throws, req.user = null if no/invalid token.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try normal JWT validation
      await super.canActivate(context)
    } catch {
      // No token or invalid token — set user to null, continue anyway
      const req = context.switchToHttp().getRequest()
      req.user = null
    }
    return true
  }

  handleRequest(_err: any, user: any) {
    return user || null
  }
}
