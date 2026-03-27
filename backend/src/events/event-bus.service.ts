import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter } from 'events'
import { BizEventName } from './event-types'

/**
 * Central EventBus for BizPrint platform.
 * All services emit events here → SyncGateway listens and broadcasts via Socket.IO.
 *
 * Pattern:
 *   Service → eventBus.emit('order.status.updated', payload)
 *   SyncGateway → listens → broadcasts to correct Socket.IO rooms
 */
@Injectable()
export class EventBusService {
  private readonly emitter = new EventEmitter()
  private readonly logger  = new Logger(EventBusService.name)

  constructor() {
    // High listener count for many modules
    this.emitter.setMaxListeners(50)
  }

  /** Emit an event with payload */
  emit(event: BizEventName, payload: any): void {
    this.logger.debug(`[EventBus] ▶ ${event}`)
    this.emitter.emit(event, payload)
  }

  /** Subscribe to an event */
  on(event: BizEventName, listener: (payload: any) => void): void {
    this.emitter.on(event, listener)
  }

  /** Subscribe once */
  once(event: BizEventName, listener: (payload: any) => void): void {
    this.emitter.once(event, listener)
  }

  /** Unsubscribe */
  off(event: BizEventName, listener: (payload: any) => void): void {
    this.emitter.off(event, listener)
  }
}
