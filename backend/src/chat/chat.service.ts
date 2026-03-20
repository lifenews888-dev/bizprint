import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChatMessage } from './chat-message.entity'
import { ChatRoom } from './chat-room.entity'
import { User } from '../users/user.entity'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private msgRepo: Repository<ChatMessage>,
    @InjectRepository(ChatRoom)
    private roomRepo: Repository<ChatRoom>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
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

  async getRoomsByOrder(orderId: string): Promise<ChatRoom[]> {
    return this.roomRepo.find({
      where: { order_id: orderId },
      order: { last_message_at: 'DESC' },
    })
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

  async listUsersByRole(role: string): Promise<User[]> {
    return this.userRepo.find({ where: { role } })
  }

  async fixParticipantNames(): Promise<any> {
    const rooms = await this.roomRepo.find()
    const userRepo = this.roomRepo.manager.getRepository('User')
    let fixed = 0
    for (const room of rooms) {
      const names = await Promise.all(
        room.participants.map(async (pid: string) => {
          if (pid === 'admin') return 'Admin'
          try {
            const user = await userRepo.findOne({ where: { id: pid } })
            if (user) return (user as any).full_name || (user as any).email || pid
          } catch {}
          return pid
        })
      )
      room.participant_names = names
      await this.roomRepo.save(room)
      fixed++
    }
    return { fixed, message: 'Done' }
  }
}
