import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ChatService } from './chat.service'

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private connectedUsers = new Map<string, string>()

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log('Chat client connected:', client.id)
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id)
    console.log('Chat client disconnected:', client.id)
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; userName: string; role: string },
  ) {
    this.connectedUsers.set(client.id, data.userId)
    client.join('user-' + data.userId)
    const rooms = await this.chatService.getRoomsForUser(data.userId)
    for (const room of rooms) {
      client.join(room.room_id)
    }
    client.emit('joined', { rooms })
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room_id: string },
  ) {
    client.join(data.room_id)
    const messages = await this.chatService.getMessages(data.room_id)
    client.emit('room_messages', { room_id: data.room_id, messages })
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      room_id: string
      sender_id: string
      sender_name: string
      sender_role: string
      message: string
      file_url?: string
    },
  ) {
    const saved = await this.chatService.saveMessage(data)
    this.server.to(data.room_id).emit('new_message', saved)
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      type: string
      participants: string[]
      participantNames: string[]
      orderId?: string
    },
  ) {
    const room = await this.chatService.getOrCreateRoom(data)
    client.join(room.room_id)
    this.server.to(room.room_id).emit('room_created', room)
    return room
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room_id: string; user_id: string },
  ) {
    await this.chatService.markRead(data.room_id, data.user_id)
    this.server.to(data.room_id).emit('messages_read', data)
  }
}