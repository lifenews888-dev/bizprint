# BizPrint Internal Chat System
# WebSocket + NestJS + Next.js
# Run: .\bizprint-chat.ps1

$BACK = "C:\Users\User\projects\bizprint\backend\src"
$FRONT = "C:\Users\User\projects\bizprint\frontend"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  BizPrint Chat System Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

function Write-File($path, $content) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] $path" -ForegroundColor Green
}

# ============================================================
# 1. BACKEND - Chat Message Entity
# ============================================================
Write-Host ""
Write-Host "[1/6] Chat entities..." -ForegroundColor Yellow

Write-File "$BACK\chat\chat-message.entity.ts" @"
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  room_id: string

  @Column()
  sender_id: string

  @Column()
  sender_name: string

  @Column()
  sender_role: string

  @Column({ type: 'text' })
  message: string

  @Column({ nullable: true })
  file_url: string

  @Column({ default: false })
  is_read: boolean

  @CreateDateColumn()
  created_at: Date
}
"@

Write-File "$BACK\chat\chat-room.entity.ts" @"
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  room_id: string

  @Column()
  type: string

  @Column({ nullable: true })
  order_id: string

  @Column({ type: 'simple-array' })
  participants: string[]

  @Column({ type: 'simple-array' })
  participant_names: string[]

  @Column({ nullable: true })
  last_message: string

  @Column({ nullable: true })
  last_message_at: Date

  @Column({ default: 0 })
  unread_count: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
"@

# ============================================================
# 2. BACKEND - Chat Service
# ============================================================
Write-Host "[2/6] Chat service..." -ForegroundColor Yellow

Write-File "$BACK\chat\chat.service.ts" @"
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChatMessage } from './chat-message.entity'
import { ChatRoom } from './chat-room.entity'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private msgRepo: Repository<ChatMessage>,
    @InjectRepository(ChatRoom)
    private roomRepo: Repository<ChatRoom>,
  ) {}

  async getOrCreateRoom(params: {
    type: string
    participants: string[]
    participantNames: string[]
    orderId?: string
  }): Promise<ChatRoom> {
    const sorted = [...params.participants].sort()
    const room_id = params.orderId
      ? 'order-' + params.orderId + '-' + sorted.join('-')
      : sorted.join('-')

    let room = await this.roomRepo.findOne({ where: { room_id } })
    if (!room) {
      room = this.roomRepo.create({
        room_id,
        type: params.type,
        order_id: params.orderId,
        participants: params.participants,
        participant_names: params.participantNames,
      })
      await this.roomRepo.save(room)
    }
    return room
  }

  async getRoomsForUser(userId: string): Promise<ChatRoom[]> {
    const rooms = await this.roomRepo.find({
      order: { last_message_at: 'DESC' },
    })
    return rooms.filter(r => r.participants.includes(userId))
  }

  async getAllRooms(): Promise<ChatRoom[]> {
    return this.roomRepo.find({ order: { last_message_at: 'DESC' } })
  }

  async getMessages(room_id: string, limit = 50): Promise<ChatMessage[]> {
    return this.msgRepo.find({
      where: { room_id },
      order: { created_at: 'ASC' },
      take: limit,
    })
  }

  async saveMessage(data: {
    room_id: string
    sender_id: string
    sender_name: string
    sender_role: string
    message: string
    file_url?: string
  }): Promise<ChatMessage> {
    const msg = this.msgRepo.create(data)
    const saved = await this.msgRepo.save(msg)

    await this.roomRepo.update(
      { room_id: data.room_id },
      { last_message: data.message, last_message_at: new Date() },
    )

    return saved
  }

  async markRead(room_id: string, user_id: string) {
    await this.msgRepo.update(
      { room_id, is_read: false },
      { is_read: true },
    )
    await this.roomRepo.update({ room_id }, { unread_count: 0 })
  }

  async getUnreadCount(userId: string): Promise<number> {
    const rooms = await this.getRoomsForUser(userId)
    const ids = rooms.map(r => r.room_id)
    if (ids.length === 0) return 0
    let count = 0
    for (const id of ids) {
      const c = await this.msgRepo.count({ where: { room_id: id, is_read: false } })
      count += c
    }
    return count
  }
}
"@

# ============================================================
# 3. BACKEND - WebSocket Gateway
# ============================================================
Write-Host "[3/6] WebSocket gateway..." -ForegroundColor Yellow

Write-File "$BACK\chat\chat.gateway.ts" @"
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
"@

# ============================================================
# 4. BACKEND - Chat Controller + Module
# ============================================================
Write-Host "[4/6] Controller and module..." -ForegroundColor Yellow

Write-File "$BACK\chat\chat.controller.ts" @"
import { Controller, Get, Param, Query } from '@nestjs/common'
import { ChatService } from './chat.service'

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('rooms')
  getAllRooms() {
    return this.chatService.getAllRooms()
  }

  @Get('rooms/user/:userId')
  getUserRooms(@Param('userId') userId: string) {
    return this.chatService.getRoomsForUser(userId)
  }

  @Get('messages/:roomId')
  getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getMessages(roomId)
  }

  @Get('unread/:userId')
  getUnread(@Param('userId') userId: string) {
    return this.chatService.getUnreadCount(userId)
  }
}
"@

Write-File "$BACK\chat\chat.module.ts" @"
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatMessage } from './chat-message.entity'
import { ChatRoom } from './chat-room.entity'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { ChatController } from './chat.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, ChatRoom])],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
"@

# ============================================================
# 5. Register ChatModule in app.module.ts
# ============================================================
Write-Host "[5/6] Registering ChatModule..." -ForegroundColor Yellow

$appPath = "$BACK\app.module.ts"
$appContent = [System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)

if ($appContent -notmatch "ChatModule") {
    $appContent = $appContent -replace "(import \{ Module \} from '@nestjs/common')", "`$1`nimport { ChatModule } from './chat/chat.module'"
    $appContent = $appContent -replace "(imports: \[)", "`$1`n    ChatModule,"
    [System.IO.File]::WriteAllText($appPath, $appContent, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] ChatModule registered" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] ChatModule already registered" -ForegroundColor Yellow
}

# ============================================================
# 6. Install socket.io
# ============================================================
Write-Host "[6/6] Installing socket.io packages..." -ForegroundColor Yellow
Write-Host "  Run these commands manually:" -ForegroundColor White
Write-Host "  cd C:\Users\User\projects\bizprint\backend" -ForegroundColor Gray
Write-Host "  npm install @nestjs/websockets @nestjs/platform-socket.io socket.io" -ForegroundColor Gray
Write-Host ""
Write-Host "  cd C:\Users\User\projects\bizprint\frontend" -ForegroundColor Gray
Write-Host "  npm install socket.io-client" -ForegroundColor Gray

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  BACKEND CHAT DONE!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Frontend chat UI script" -ForegroundColor Yellow
