import { Controller, Get, Param, Post } from '@nestjs/common'
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

  @Post('fix-names')
  fixNames() {
    return this.chatService.fixParticipantNames()
  }
}
