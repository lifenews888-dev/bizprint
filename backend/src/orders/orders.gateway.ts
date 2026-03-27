import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets'
import { Logger, OnModuleInit } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { EventBusService } from '../events/event-bus.service'
import { BizEvent } from '../events/event-types'

/**
 * Orders Gateway — namespace /orders
 * Kept for backwards compatibility with existing mobile/web clients.
 * Also listens to EventBus for ORDER_STATUS_UPDATED.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class OrdersGateway implements OnGatewayInit, OnModuleInit {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(OrdersGateway.name)

  constructor(private readonly eventBus: EventBusService) {}

  afterInit() {
    this.logger.log('OrdersGateway initialized on /orders')
  }

  onModuleInit() {
    // Mirror events from EventBus → /orders namespace (backwards compat)
    this.eventBus.on(BizEvent.ORDER_STATUS_UPDATED, (p: any) => {
      if (p.orderId) {
        this.server.to(`order:${p.orderId}`).emit('order_status_updated', {
          orderId: p.orderId,
          status: p.status,
          previousStatus: p.previousStatus,
          updatedAt: new Date().toISOString(),
          ...p.data,
        })
      }
      if (p.userId) {
        this.server.to(`user:${p.userId}`).emit('order_status_updated', {
          orderId: p.orderId,
          status: p.status,
          updatedAt: new Date().toISOString(),
        })
      }
    })
  }

  @SubscribeMessage('join_order')
  handleJoinOrder(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const orderId = typeof data === 'string' ? data : data?.order_id || data?.orderId
    if (orderId) {
      client.join(`order:${orderId}`)
      return { joined: `order:${orderId}` }
    }
  }

  @SubscribeMessage('join_user')
  handleJoinUser(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    client.join(`user:${userId}`)
    return { joined: `user:${userId}` }
  }

  // ── Called directly by OrdersService ─────────────────────────────────────

  notifyStatusChange(orderId: string, status: string, data?: any) {
    const payload = { orderId, status, updatedAt: new Date().toISOString(), ...data }
    this.server.to(`order:${orderId}`).emit('status_changed', payload)
    this.server.to(`order:${orderId}`).emit('order_status_updated', payload)
    // Also emit to EventBus so SyncGateway broadcasts to /sync
    this.eventBus.emit(BizEvent.ORDER_STATUS_UPDATED, { orderId, status, ...data })
  }

  notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data)
  }
}
