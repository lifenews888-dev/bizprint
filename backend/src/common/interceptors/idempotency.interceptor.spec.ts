import { ExecutionContext } from '@nestjs/common'
import { lastValueFrom, of } from 'rxjs'
import { IdempotencyInterceptor } from './idempotency.interceptor'

function makeContext(path: string, rawKey = 'same-key'): ExecutionContext {
  const req = {
    headers: { 'x-idempotency-key': rawKey },
    method: 'POST',
    originalUrl: path,
    user: { id: 'user-1' },
  }

  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
    getHandler: () => function handler() {},
  } as unknown as ExecutionContext
}

describe('IdempotencyInterceptor', () => {
  it('replays the cached response for the same user, method, route and key', async () => {
    const interceptor = new IdempotencyInterceptor()
    const context = makeContext('/cart/quote')
    const handler = {
      handle: jest.fn()
        .mockReturnValueOnce(of({ quotation_id: 'quote-1' }))
        .mockReturnValueOnce(of({ quotation_id: 'quote-2' })),
    }

    await expect(lastValueFrom(interceptor.intercept(context, handler))).resolves.toEqual({ quotation_id: 'quote-1' })
    await expect(lastValueFrom(interceptor.intercept(context, handler))).resolves.toEqual({ quotation_id: 'quote-1' })
    expect(handler.handle).toHaveBeenCalledTimes(1)
  })

  it('does not replay a response for a different route with the same raw key', async () => {
    const interceptor = new IdempotencyInterceptor()
    const quoteContext = makeContext('/cart/quote')
    const confirmContext = makeContext('/cart/quote/confirm')
    const quoteHandler = { handle: jest.fn(() => of({ quotation_id: 'quote-1' })) }
    const confirmHandler = { handle: jest.fn(() => of({ order_id: 'order-1' })) }

    await expect(lastValueFrom(interceptor.intercept(quoteContext, quoteHandler))).resolves.toEqual({ quotation_id: 'quote-1' })
    await expect(lastValueFrom(interceptor.intercept(confirmContext, confirmHandler))).resolves.toEqual({ order_id: 'order-1' })
    expect(quoteHandler.handle).toHaveBeenCalledTimes(1)
    expect(confirmHandler.handle).toHaveBeenCalledTimes(1)
  })
})
