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
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Server, Socket } from 'socket.io'
import { EventBusService } from '../events/event-bus.service'
import { BizEvent } from '../events/event-types'
import { Order } from '../orders/entities/order.entity'
import { DesignRequest } from '../design-requests/design-request.entity'
import { Vendor } from '../vendors/vendor.entity'
import { OrderVendorGroup } from '../orders/entities/order-vendor-group.entity'

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
type AuthUser = {
  id: string
  role: string
  email?: string
}

@WebSocketGateway({
  namespace: '/sync',
  cors: {
    origin: (origin, callback) => {
      const raw = process.env.CORS_ORIGINS || ''
      const allowed = raw.split(',').map((s) => s.trim()).filter(Boolean)
      if (!origin) return callback(null, true)
      if (!allowed.length || allowed.includes(origin)) return callback(null, true)
      return callback(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
  },
})
export class SyncGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(SyncGateway.name)

  constructor(
    private readonly eventBus: EventBusService,
    private readonly jwtService: JwtService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(DesignRequest)
    private readonly designRepo: Repository<DesignRequest>,
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(OrderVendorGroup)
    private readonly orderVendorGroupRepo: Repository<OrderVendorGroup>,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  onModuleInit() {
    this.subscribeToEvents()
  }

  afterInit() {
    this.logger.log('SyncGateway initialized on namespace /sync')
  }

  handleConnection(client: Socket) {
    const user = this.authenticateSocket(client)
    if (!user) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Authentication required' })
      client.disconnect()
      return
    }

    client.data.user = user
    // Auto-join global room
    client.join('global')
    this.logger.debug(`Client connected: ${client.id} user=${user.id} role=${user.role}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`)
  }

  // ── Room management (client-side calls) ─────────────────────────────────────

  /** Join one or multiple rooms */
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rooms: string[] } | string,
  ) {
    const user = client.data.user as AuthUser | undefined
    if (!user) return { ok: false, error: 'unauthorized' }

    const rooms = Array.isArray((data as any).rooms) ? (data as any).rooms : [data]
    const joined: string[] = []

    for (const room of rooms) {
      if (!(await this.isRoomAllowed(room, user))) continue
      client.join(room)
      joined.push(room)
    }
    return { ok: true, joined }
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

  private authenticateSocket(client: Socket): AuthUser | null {
    const hs = client.handshake
    const bearer =
      typeof hs.auth?.token === 'string'
        ? hs.auth.token
        : typeof hs.headers?.authorization === 'string'
          ? hs.headers.authorization.replace(/^Bearer\s+/i, '')
          : typeof hs.query?.token === 'string'
            ? hs.query.token
            : null

    if (!bearer) return null
    try {
      const payload = this.jwtService.verify(bearer) as any
      if (!payload?.sub || !payload?.role) return null
      return { id: String(payload.sub), role: String(payload.role), email: payload.email }
    } catch {
      return null
    }
  }

  private async isRoomAllowed(room: string, user: AuthUser): Promise<boolean> {
    if (!room || typeof room !== 'string') return false
    if (room === 'global') return true
    if (room === 'admin') return user.role === 'admin' || user.role === 'superadmin'
    if (room.startsWith('user:')) return room === `user:${user.id}`
    if (room.startsWith('vendor:')) {
      if (user.role !== 'vendor') return false
      const vendor = await this.vendorRepo.findOne({ where: { user_id: user.id }, select: ['id'] })
      return !!vendor && room === `vendor:${vendor.id}`
    }
    if (room.startsWith('designer:')) {
      return (user.role === 'designer' || user.role === 'creator') && room === `designer:${user.id}`
    }
    if (room.startsWith('order:')) {
      const orderId = room.slice('order:'.length)
      return this.canAccessOrder(orderId, user)
    }
    if (room.startsWith('design:')) {
      const designRequestId = room.slice('design:'.length)
      return this.canAccessDesignRequest(designRequestId, user)
    }
    return false
  }

  private async canAccessOrder(orderId: string, user: AuthUser): Promise<boolean> {
    if (!orderId) return false
    if (user.role === 'admin' || user.role === 'superadmin') return true

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      select: ['id', 'customer_id', 'assigned_vendor_id'],
    })
    if (!order) return false

    if (order.customer_id && order.customer_id === user.id) return true

    if (user.role === 'vendor') {
      const vendor = await this.vendorRepo.findOne({ where: { user_id: user.id }, select: ['id'] })
      if (!vendor) return false
      if (order.assigned_vendor_id && order.assigned_vendor_id === vendor.id) return true
      const linked = await this.orderVendorGroupRepo.findOne({
        where: { order_id: orderId, vendor_id: vendor.id },
        select: ['id'],
      })
      return !!linked
    }

    return false
  }

  private async canAccessDesignRequest(designRequestId: string, user: AuthUser): Promise<boolean> {
    if (!designRequestId) return false
    if (user.role === 'admin' || user.role === 'superadmin') return true

    const dr = await this.designRepo.findOne({
      where: { id: designRequestId },
      select: ['id', 'customer_id', 'designer_id'],
    })
    if (!dr) return false
    if (dr.customer_id && dr.customer_id === user.id) return true
    if (dr.designer_id && dr.designer_id === user.id) return true
    return false
  }
}
