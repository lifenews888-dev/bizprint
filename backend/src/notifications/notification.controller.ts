import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  // Admin: get all notifications for a specific user
  @Get()
  getAll(@Query('userId') userId = 'admin', @Query('limit') limit?: string) {
    return this.service.findForUser(userId, limit ? Number(limit) : 50)
  }

  // User: get own notifications (JWT-based)
  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyNotifications(@Request() req: any, @Query('limit') limit?: string, @Query('type') type?: string) {
    return this.service.findForUser(req.user.id, limit ? Number(limit) : 50, type)
  }

  // User: get unread count
  @Get('my/unread-count')
  @UseGuards(JwtAuthGuard)
  getMyUnreadCount(@Request() req: any) {
    return this.service.getUnreadCount(req.user.id)
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markRead(Number(id))
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAll(@Request() req: any, @Query('userId') userId?: string) {
    // If admin provides userId, use that; otherwise use JWT user
    const targetUserId = userId || req.user.id
    return this.service.markAllRead(targetUserId)
  }

  @Post('register-push')
  @UseGuards(JwtAuthGuard)
  registerPush(@Request() req: any, @Body() body: { token: string; platform?: string; device_id?: string }) {
    return this.service.registerPushToken(req.user.id, body.token, body.platform || 'web', body.device_id)
  }

  @Delete('unregister-push')
  @UseGuards(JwtAuthGuard)
  unregisterPush(@Body() body: { token: string }) {
    return this.service.unregisterPushToken(body.token)
  }
}
