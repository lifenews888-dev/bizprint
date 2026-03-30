import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZoomService } from '../design-requests/zoom.service';
import { NotificationService } from '../notifications/notification.service';

@Controller('zoom')
export class ZoomController {
  constructor(
    private zoomService: ZoomService,
    private notificationService: NotificationService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createMeeting(
    @Body() body: {
      topic: string;
      scheduled_at?: string;
      duration_minutes?: number;
      participant_id?: string;
    },
    @Request() req: any,
  ) {
    const meeting = await this.zoomService.createMeeting({
      topic: body.topic || 'BizPrint Meeting',
      scheduledAt: body.scheduled_at ? new Date(body.scheduled_at) : undefined,
      durationMinutes: body.duration_minutes || 30,
      hostEmail: req.user?.email,
    });

    if (!meeting) {
      return {
        success: false,
        message: 'Zoom тохиргоо хийгдээгүй байна. ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET тохируулна уу.',
        fallback: 'Дизайнерын хувийн Zoom линк ашиглана уу.',
      };
    }

    // Notify participant if specified
    if (body.participant_id) {
      try {
        await this.notificationService.create({
          user_id: body.participant_id,
          type: 'MEETING' as any,
          title: 'Zoom уулзалтын урилга',
          message: `${req.user?.full_name || req.user?.email} таныг "${body.topic}" уулзалтанд урьж байна`,
          data: { join_url: meeting.join_url, meeting_id: meeting.meeting_id },
        });
      } catch {}
    }

    return {
      success: true,
      meeting_id: meeting.meeting_id,
      join_url: meeting.join_url,
      start_url: meeting.start_url,
      password: meeting.password,
    };
  }
}
