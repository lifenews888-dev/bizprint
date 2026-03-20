import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    client.join(`user:${userId}`)
  }

  notifyUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new_notification', notification)
  }
}
