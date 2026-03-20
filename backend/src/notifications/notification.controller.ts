import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

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
