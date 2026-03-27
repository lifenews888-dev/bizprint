import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ChatService } from './chat.service'
import { NotificationService } from '../notifications/notification.service'

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private connectedUsers = new Map<string, string>()

  constructor(
    private chatService: ChatService,
    private notificationService: NotificationService,
  ) {}

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
    if (data.role === 'admin') {
      client.join('admin-notify')
    }
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
    // emit both event names for backward compatibility
    this.server.to(data.room_id).emit('new_message', saved)
    this.server.to(data.room_id).emit('message', saved)
    // notify admins
    this.server.to('admin-notify').emit('notify', {
      type: 'chat',
      room_id: data.room_id,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      message: data.message,
      file_url: data.file_url,
      created_at: saved.created_at,
    })
    // persist notification for admin user
    await this.notificationService.create({
      user_id: 'admin',
      type: 'chat',
      title: `Шинэ чат: ${data.sender_name || data.sender_id}`,
      message: data.message,
      data: { room_id: data.room_id, sender_id: data.sender_id, file_url: data.file_url },
    })
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

  // ── Typing indicators ─────────────────────────────────────────────────────
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room_id: string; user_id: string; user_name: string },
  ) {
    // Broadcast to room except sender
    client.to(data.room_id).emit('user_typing', {
      room_id: data.room_id,
      user_id: data.user_id,
      user_name: data.user_name,
    })
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room_id: string; user_id: string; user_name: string },
  ) {
    client.to(data.room_id).emit('user_stop_typing', {
      room_id: data.room_id,
      user_id: data.user_id,
      user_name: data.user_name,
    })
  }
}
