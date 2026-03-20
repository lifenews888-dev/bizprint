import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface StandardResponse<T> {
  success: boolean
  data: T
  meta: { timestamp: string; version: string }
  error: null | { code: string; message: string }
}

/**
 * Wraps API responses in standard format ONLY when the request
 * includes header `X-Api-Version: 2`. This keeps backward compatibility
 * with the existing web frontend while giving mobile apps a standard format.
 *
 * Usage: Apply globally in main.ts with app.useGlobalInterceptors()
 * Mobile apps send: headers: { 'X-Api-Version': '2' }
 * Web frontend sends nothing → gets raw response (no wrapping)
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T> | T> {
    const request = context.switchToHttp().getRequest()
    const apiVersion = request?.headers?.['x-api-version']

    if (apiVersion === '2') {
      return next.handle().pipe(
        map(data => ({
          success: true,
          data,
          meta: { timestamp: new Date().toISOString(), version: '2.0' },
          error: null,
        })),
      )
    }

    // No wrapping for web frontend (backward compatible)
    return next.handle()
  }
}
