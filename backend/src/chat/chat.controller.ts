import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common'
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

  @Get('rooms/by-order/:orderId')
  getRoomsByOrder(@Param('orderId') orderId: string) {
    return this.chatService.getRoomsByOrder(orderId)
  }

  @Get('messages/:roomId')
  getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getMessages(roomId)
  }

  // Direct messages resolved to a room (e.g., admin ↔ user); orderId for order-thread
  @Get('messages')
  async getMessagesByUser(
    @Query('userId') userId: string,
    @Query('me') meId = 'admin',
    @Query('orderId') orderId?: string,
  ) {
    const room = await this.chatService.getOrCreateRoom({
      type: orderId ? 'order' : 'direct',
      participants: [meId, userId],
      participantNames: [],
      orderId,
    })
    return this.chatService.getMessages(room.room_id)
  }

  // Send message (text or file) to receiver; creates room if missing
  @Post('send')
  async sendMessage(
    @Body() body: { receiverId: string; content: string; senderId?: string; senderName?: string; senderRole?: string; orderId?: string; fileUrl?: string },
  ) {
    const senderId = body.senderId || 'admin'
    const senderName = body.senderName || 'Admin'
    const senderRole = body.senderRole || 'admin'
    const room = await this.chatService.getOrCreateRoom({
      type: body.orderId ? 'order' : 'direct',
      participants: [senderId, body.receiverId],
      participantNames: [senderName, body.receiverId],
      orderId: body.orderId,
    })
    return this.chatService.saveMessage({
      room_id: room.room_id,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      message: body.content,
      file_url: body.fileUrl,
    })
  }

  @Get('unread/:userId')
  getUnread(@Param('userId') userId: string) {
    return this.chatService.getUnreadCount(userId)
  }

  @Post('fix-names')
  fixNames() {
    return this.chatService.fixParticipantNames()
  }

  // List users by role (for customer to pick designer/sales)
  @Get('users/role/:role')
  listByRole(@Param('role') role: string) {
    return this.chatService.listUsersByRole(role)
  }
}
