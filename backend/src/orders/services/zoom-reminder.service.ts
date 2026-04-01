import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../order.service';
import { MailService } from '../../mail/mail.service';
import { NotificationService } from '../../notifications/notification.service';

/**
 * ZoomReminderService — Runs every minute, checks for Zoom meetings
 * starting in ~15 minutes and sends browser notification + email.
 */
@Injectable()
export class ZoomReminderService {
  private readonly logger = new Logger(ZoomReminderService.name);

  constructor(
    private ordersService: OrdersService,
    private mailService: MailService,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingMeetings() {
    try {
      const orders = await this.ordersService.getOrdersWithUpcomingZoom(15);
      if (!orders.length) return;

      this.logger.log(`Found ${orders.length} orders with Zoom meetings in ~15 min`);

      for (const order of orders) {
        // Browser notification (via WebSocket → NotificationBell component)
        if (order.customer_id) {
          await this.notificationService.create({
            user_id: order.customer_id,
            type: 'order',
            title: '📹 Уулзалт 15 минутын дараа эхэлнэ!',
            message: `${order.product_name || 'Захиалга'} — Zoom уулзалтад бэлтгэнэ үү`,
            data: {
              order_id: order.id,
              join_url: order.zoom_join_url,
              meeting_id: order.zoom_meeting_id,
              action: 'zoom_reminder',
            },
          }).catch(() => {});
        }

        // Email reminder
        if (order.customer_email) {
          try {
            await this.mailService.sendMeetingReminder({
              to: order.customer_email,
              customerName: order.customer_name || 'Хэрэглэгч',
              productName: order.product_name || 'Захиалга',
              joinUrl: order.zoom_join_url || 'https://zoom.us',
              password: order.zoom_password,
              scheduledAt: order.zoom_scheduled_at,
              orderId: order.id,
            });
          } catch (e) {
            this.logger.warn(`Reminder email failed for order ${order.id}: ${e.message}`);
          }
        }

        // Mark reminder as sent
        await this.ordersService.markZoomReminderSent(order.id);
      }
    } catch (e) {
      this.logger.error(`Zoom reminder check failed: ${e.message}`);
    }
  }
}
