import { Controller, Post, Body, Headers, HttpCode, UnauthorizedException, Logger } from '@nestjs/common';

// ─── POS Webhook Controller ─────────────────────────
// External POS systems (CU, Nomin, etc.) send purchase data here.
// We auto-credit Loyalty Stamps based on the transaction.

interface PosWebhookPayload {
  order_id: string;
  amount: number;
  currency?: string;          // MNT default
  customer_id?: string;       // BizPrint user ID
  customer_phone?: string;    // Fallback: match by phone
  pos_name: string;           // 'CU', 'Nomin', etc.
  store_id?: string;
  items?: { name: string; qty: number; price: number }[];
  timestamp: string;          // ISO
  signature?: string;         // HMAC for verification
}

interface WebhookResponse {
  success: boolean;
  message: string;
  stamps_awarded?: number;
  loyalty_card_id?: string;
}

@Controller('api/webhooks')
export class PosWebhookController {
  private readonly logger = new Logger('POS_WEBHOOK');

  @Post('pos')
  @HttpCode(200)
  async handlePosTransaction(
    @Body() payload: PosWebhookPayload,
    @Headers('x-webhook-secret') secret: string,
  ): Promise<WebhookResponse> {
    // 1. Verify webhook secret
    const expectedSecret = process.env.POS_WEBHOOK_SECRET || 'bizprint-pos-secret';
    if (secret !== expectedSecret) {
      this.logger.warn(`Invalid webhook secret from ${payload.pos_name}`);
      throw new UnauthorizedException('Invalid webhook secret');
    }

    this.logger.log(`POS webhook: ${payload.pos_name} order=${payload.order_id} amount=${payload.amount}`);

    // 2. Find user by ID or phone
    // In production: inject UserRepository and LoyaltyService
    const userId = payload.customer_id || null;
    const phone = payload.customer_phone || null;

    if (!userId && !phone) {
      return { success: false, message: 'No customer identifier provided' };
    }

    // 3. Calculate stamps based on amount
    // Rule: 1 stamp per 10,000₮ spent
    const STAMP_THRESHOLD = 10_000;
    const stampsToAward = Math.floor(payload.amount / STAMP_THRESHOLD);

    if (stampsToAward === 0) {
      return { success: true, message: 'Transaction recorded, amount below stamp threshold', stamps_awarded: 0 };
    }

    // 4. Award stamps (placeholder — wire to LoyaltyService)
    this.logger.log(`Awarding ${stampsToAward} stamps to user=${userId || phone} from ${payload.pos_name}`);

    // TODO: Inject LoyaltyService and call:
    // const result = await this.loyaltyService.awardStamps(userId, phone, stampsToAward, {
    //   source: 'pos_webhook',
    //   pos_name: payload.pos_name,
    //   order_id: payload.order_id,
    //   amount: payload.amount,
    // });

    return {
      success: true,
      message: `${stampsToAward} stamp(s) awarded`,
      stamps_awarded: stampsToAward,
    };
  }

  @Post('pos/verify')
  @HttpCode(200)
  async verifyWebhook(): Promise<{ status: string }> {
    // POS systems call this to verify the webhook URL is active
    return { status: 'active' };
  }
}
