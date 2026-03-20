import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatMessage } from './chat-message.entity'
import { ChatRoom } from './chat-room.entity'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { ChatController } from './chat.controller'
import { NotificationModule } from '../notifications/notification.module'
import { User } from '../users/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, ChatRoom, User]), NotificationModule],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
