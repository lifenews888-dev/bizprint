import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, of, throwError } from 'rxjs'
import { tap } from 'rxjs/operators'

/**
 * IdempotencyInterceptor — replays cached responses for duplicate requests.
 *
 * Client sends `X-Idempotency-Key: <uuid>` on a mutating request. If the same
 * key arrives again within TTL we return the same response instead of running
 * the handler twice — protects against double-clicks, network retries and
 * webhook/queue replays.
 *
 * Storage: in-memory Map. Single-process safe; for multi-instance deploys
 * swap for Redis (key namespace `idem:`). TTL = 10 minutes (covers user
 * double-click + payment redirect window).
 *
 * In-flight protection: while a request is mid-flight a duplicate is rejected
 * with 409 to avoid two parallel writes producing different bodies.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name)
  private readonly cache = new Map<string, { value: any; expires: number }>()
  private readonly inFlight = new Set<string>()
  private readonly TTL_MS = 10 * 60 * 1000

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    const rawKey = (req.headers['x-idempotency-key'] || req.headers['X-Idempotency-Key']) as string | undefined
    if (!rawKey) return next.handle()

    // Scope by user, method and route so one key cannot replay a different action.
    const userId = req.user?.id || 'anon'
    const method = req.method || 'UNKNOWN'
    const path = req.originalUrl || req.url || context.getHandler().name
    const key = `${userId}:${method}:${path}:${rawKey}`

    this.gc()

    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      this.logger.log(`Replaying idempotent response for ${key}`)
      return of(cached.value)
    }

    if (this.inFlight.has(key)) {
      return throwError(() => new ConflictException('Өмнөх ижил хүсэлт боловсруулагдаж байна'))
    }
    this.inFlight.add(key)

    return next.handle().pipe(
      tap({
        next: (value) => {
          this.cache.set(key, { value, expires: Date.now() + this.TTL_MS })
          this.inFlight.delete(key)
        },
        error: () => {
          // Don't cache errors — let the client retry with the same key.
          this.inFlight.delete(key)
        },
      }),
    )
  }

  private gc() {
    if (this.cache.size < 5000) return
    const now = Date.now()
    for (const [k, v] of this.cache) {
      if (v.expires < now) this.cache.delete(k)
    }
  }
}
