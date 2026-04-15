import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    // Accept either plain userId string (legacy) or { userId, role }
    const userId = typeof payload === 'string' ? payload : payload?.userId
    const role = typeof payload === 'object' ? payload?.role : null
    if (userId) client.join(`user:${userId}`)
    if (role) client.join(`role:${role}`)
  }

  // ─── Target a single user ───
  notifyUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new_notification', notification)
  }

  // ─── Broadcast to all admins/superadmins ───
  notifyAdmins(notification: any) {
    this.server.to('role:admin').emit('new_notification', notification)
    this.server.to('role:superadmin').emit('new_notification', notification)
  }

  // ─── Broadcast to all vendors ───
  notifyVendors(notification: any) {
    this.server.to('role:vendor').emit('new_notification', notification)
  }

  // ─── Helpers for inquiry events ───
  notifyVendorNewInquiry(vendorUserId: string | null | undefined, inquiry: any) {
    const payload = {
      type: 'new_inquiry',
      title: 'Шинэ захиалга ирлээ',
      message: `${inquiry.product_name || inquiry.category || ''} — ${Number(inquiry.quantity || 0).toLocaleString()} ш`,
      inquiryId: inquiry.id,
      estimatedPrice: Number(inquiry.estimated_price || 0),
      timestamp: new Date().toISOString(),
    }
    if (vendorUserId) this.notifyUser(vendorUserId, payload)
    else this.notifyVendors(payload)
  }

  notifyAdminNewInquiry(inquiry: any) {
    this.notifyAdmins({
      type: 'new_inquiry',
      title: 'Шинэ захиалга',
      message: `${inquiry.product_name || inquiry.category || ''} — ${inquiry.customer_name || ''}`,
      inquiryId: inquiry.id,
      timestamp: new Date().toISOString(),
    })
  }
}
