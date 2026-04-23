import {
  Controller, Post, Body, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { LoyaltyService } from '../../loyalty/loyalty.service';

@Controller('webhooks/pos')
export class PosController {
  private readonly logger = new Logger(PosController.name);

  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post()
  async handlePosWebhook(@Body() body: any) {
    this.logger.log('POS webhook received');
    try {
      const res = await this.loyaltyService.processTx(body);
      this.logger.log('POS webhook processed successfully');
      return { success: true, data: res };
    } catch (error) {
      this.logger.error('POS webhook error: ' + error.message, error.stack);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
