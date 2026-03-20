import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class OrdersGateway {
  @WebSocketServer()
  server: Server

  @SubscribeMessage('join_order')
  handleJoinOrder(@ConnectedSocket() client: Socket, @MessageBody() orderId: string) {
    client.join(`order:${orderId}`)
  }

  @SubscribeMessage('join_user')
  handleJoinUser(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    client.join(`user:${userId}`)
  }

  notifyStatusChange(orderId: string, status: string, data?: any) {
    this.server.to(`order:${orderId}`).emit('status_changed', { orderId, status, updatedAt: new Date().toISOString(), ...data })
  }

  notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data)
  }
}
