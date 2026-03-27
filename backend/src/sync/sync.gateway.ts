import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger, OnModuleInit } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { EventBusService } from '../events/event-bus.service'
import { BizEvent } from '../events/event-types'

/**
 * SyncGateway — Single WebSocket namespace "/sync"
 *
 * All BizPrint real-time updates flow through here.
 * Clients connect ONCE and receive all relevant events via rooms:
 *
 *   Rooms:
 *   - "global"          → everyone (CMS, product changes)
 *   - "admin"           → admin dashboard
 *   - "user:{userId}"   → specific customer
 *   - "order:{orderId}" → order tracking page
 *   - "vendor:{id}"     → vendor dashboard
 *
 * Usage (frontend):
 *   const socket = io('/sync')
 *   socket.emit('join', { rooms: ['user:abc123', 'admin'] })
 *   socket.on('ORDER_STATUS_UPDATED', handler)
 *   socket.on('SETTINGS_UPDATED', handler)
 */
@WebSocketGateway({ namespace: '/sync', cors: { origin: '*' } })
export class SyncGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(SyncGateway.name)

  constructor(private readonly eventBus: EventBusService) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  onModuleInit() {
    this.subscribeToEvents()
  }

  afterInit() {
    this.logger.log('SyncGateway initialized on namespace /sync')
  }

  handleConnection(client: Socket) {
    // Auto-join global room
    client.join('global')
    this.logger.debug(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`)
  }

  // ── Room management (client-side calls) ─────────────────────────────────────

  /** Join one or multiple rooms */
  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rooms: string[] } | string,
  ) {
    const rooms = Array.isArray((data as any).rooms) ? (data as any).rooms : [data]
    for (const room of rooms) {
      client.join(room)
    }
    return { ok: true, joined: rooms }
  }

  /** Leave a room */
  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room)
    return { ok: true }
  }

  /** Server health ping */
  @SubscribeMessage('ping')
  handlePing() {
    return { pong: true, ts: Date.now() }
  }

  // ── Internal broadcast helpers ───────────────────────────────────────────────

  /** Broadcast to all connected clients */
  broadcast(event: string, payload: any) {
    this.server.to('global').emit(event, { ...payload, _ts: Date.now() })
  }

  /** Broadcast to specific room */
  toRoom(room: string, event: string, payload: any) {
    this.server.to(room).emit(event, { ...payload, _ts: Date.now() })
  }

  // ── Subscribe to EventBus ────────────────────────────────────────────────────

  private subscribeToEvents() {
    // ── CMS ──────────────────────────────────────────────────────────────────
    this.eventBus.on(BizEvent.SETTINGS_UPDATED, (p) => {
      this.broadcast('SETTINGS_UPDATED', p)
    })

    this.eventBus.on(BizEvent.SETTINGS_BULK_UPDATED, (p) => {
      this.broadcast('SETTINGS_BULK_UPDATED', p)
    })

    this.eventBus.on(BizEvent.MENU_UPDATED, (p) => {
      this.broadcast('MENU_UPDATED', p)
    })

    this.eventBus.on(BizEvent.BANNER_UPDATED, (p) => {
      this.broadcast('BANNER_UPDATED', p)
    })

    this.eventBus.on(BizEvent.PAGE_UPDATED, (p) => {
      this.broadcast('PAGE_UPDATED', p)
    })

    // ── Orders ────────────────────────────────────────────────────────────────
    this.eventBus.on(BizEvent.ORDER_CREATED, (p: any) => {
      // Admin sees new orders live
      this.toRoom('admin', 'ORDER_CREATED', p)
      // Vendor sees assigned job
      if (p.vendorId) this.toRoom(`vendor:${p.vendorId}`, 'ORDER_CREATED', p)
      // Customer confirmation
      if (p.userId) this.toRoom(`user:${p.userId}`, 'ORDER_CREATED', p)
    })

    this.eventBus.on(BizEvent.ORDER_STATUS_UPDATED, (p: any) => {
      // Customer tracking page
      if (p.orderId) this.toRoom(`order:${p.orderId}`, 'ORDER_STATUS_UPDATED', p)
      // Customer notifications
      if (p.userId) this.toRoom(`user:${p.userId}`, 'ORDER_STATUS_UPDATED', p)
      // Admin dashboard
      this.toRoom('admin', 'ORDER_STATUS_UPDATED', p)
      // Vendor dashboard
      if (p.vendorId) this.toRoom(`vendor:${p.vendorId}`, 'ORDER_STATUS_UPDATED', p)
    })

    this.eventBus.on(BizEvent.ORDER_PAID, (p: any) => {
      if (p.orderId) this.toRoom(`order:${p.orderId}`, 'ORDER_PAID', p)
      if (p.userId)  this.toRoom(`user:${p.userId}`,   'ORDER_PAID', p)
      this.toRoom('admin', 'ORDER_PAID', p)
    })

    this.eventBus.on(BizEvent.ORDER_CANCELLED, (p: any) => {
      if (p.orderId) this.toRoom(`order:${p.orderId}`, 'ORDER_CANCELLED', p)
      if (p.userId)  this.toRoom(`user:${p.userId}`,   'ORDER_CANCELLED', p)
      this.toRoom('admin', 'ORDER_CANCELLED', p)
    })

    // ── Products ──────────────────────────────────────────────────────────────
    this.eventBus.on(BizEvent.PRODUCT_CREATED, (p: any) => {
      this.broadcast('PRODUCT_CREATED', p)
      this.toRoom('admin', 'PRODUCT_CREATED', p)
    })

    this.eventBus.on(BizEvent.PRODUCT_UPDATED, (p: any) => {
      this.broadcast('PRODUCT_UPDATED', p)
    })

    this.eventBus.on(BizEvent.PRODUCT_DELETED, (p: any) => {
      this.broadcast('PRODUCT_DELETED', p)
    })

    // ── Production ────────────────────────────────────────────────────────────
    this.eventBus.on(BizEvent.PRODUCTION_UPDATED, (p: any) => {
      if (p.orderId) this.toRoom(`order:${p.orderId}`, 'PRODUCTION_UPDATED', p)
      this.toRoom('admin', 'PRODUCTION_UPDATED', p)
      if (p.vendorId) this.toRoom(`vendor:${p.vendorId}`, 'PRODUCTION_UPDATED', p)
    })

    this.eventBus.on(BizEvent.JOB_ASSIGNED, (p: any) => {
      if (p.vendorId) this.toRoom(`vendor:${p.vendorId}`, 'JOB_ASSIGNED', p)
      this.toRoom('admin', 'JOB_ASSIGNED', p)
    })

    // ── Notifications ─────────────────────────────────────────────────────────
    this.eventBus.on(BizEvent.NOTIFICATION, (p: any) => {
      if (p.userId) this.toRoom(`user:${p.userId}`, 'NOTIFICATION', p.notification)
    })

    // ── Vendor ────────────────────────────────────────────────────────────────
    this.eventBus.on(BizEvent.VENDOR_UPDATED, (p: any) => {
      if (p.vendorId) this.toRoom(`vendor:${p.vendorId}`, 'VENDOR_UPDATED', p)
      this.toRoom('admin', 'VENDOR_UPDATED', p)
    })

    // ── Design Approval Workflow ───────────────────────────────────────────────
    // All design events go to: designer room, customer room, admin
    // socketEvent = uppercase key that the frontend subscribes to (e.g. 'DESIGN_ZOOM_CREATED')
    // busEvent    = internal EventBus value (e.g. 'design.zoom.created')
    const designEvent = (busEvent: string, socketEvent: string) => {
      this.eventBus.on(busEvent as any, (p: any) => {
        const drRoom = `design:${p.designRequestId}`
        this.toRoom(drRoom, socketEvent, p)
        if (p.customerId) this.toRoom(`user:${p.customerId}`, socketEvent, p)
        if (p.designerId) this.toRoom(`designer:${p.designerId}`, socketEvent, p)
        this.toRoom('admin', socketEvent, p)
      })
    }

    designEvent(BizEvent.DESIGN_FILE_UPLOADED,       'DESIGN_FILE_UPLOADED')
    designEvent(BizEvent.DESIGN_REVISION_REQUESTED,  'DESIGN_REVISION_REQUESTED')
    designEvent(BizEvent.DESIGN_VERSION_UPDATED,     'DESIGN_VERSION_UPDATED')
    designEvent(BizEvent.DESIGN_ZOOM_CREATED,        'DESIGN_ZOOM_CREATED')
    designEvent(BizEvent.DESIGN_APPROVED,            'DESIGN_APPROVED')
    designEvent(BizEvent.DESIGN_REJECTED,            'DESIGN_REJECTED')
    designEvent(BizEvent.DESIGN_IN_PRODUCTION,       'DESIGN_IN_PRODUCTION')
    designEvent(BizEvent.DESIGN_COMMENT_ADDED,       'DESIGN_COMMENT_ADDED')

    this.logger.log('EventBus subscriptions registered')
  }
}
