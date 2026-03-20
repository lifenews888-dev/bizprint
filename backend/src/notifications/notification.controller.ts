import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common'
import { NotificationService } from './notification.service'

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  getAll(@Query('userId') userId = 'admin', @Query('limit') limit?: string) {
    return this.service.findForUser(userId, limit ? Number(limit) : 50)
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markRead(Number(id))
  }

  @Patch('read-all')
  markAll(@Query('userId') userId = 'admin') {
    return this.service.markAllRead(userId)
  }
}
