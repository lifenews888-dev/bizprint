import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { QuoteDeliveryChannel } from './quote-delivery.entity'
import { QuoteDeliveryService } from './quote-delivery.service'

class SendQuoteDto {
  recipient_email?: string
  recipient_phone?: string
  delivery_channel?: QuoteDeliveryChannel
  validity_hours?: number
}

@Controller()
export class QuoteDeliveryController {
  constructor(private readonly quoteDeliveryService: QuoteDeliveryService) {}

  @Post('quotes/:id/send')
  sendQuote(@Param('id') quoteId: string, @Body() dto: SendQuoteDto) {
    return this.quoteDeliveryService.sendQuote({
      quote_id: quoteId,
      recipient_email: dto.recipient_email,
      recipient_phone: dto.recipient_phone,
      delivery_channel: dto.delivery_channel,
      validity_hours: dto.validity_hours,
    })
  }

  @Get('q/:token')
  openQuote(@Param('token') token: string) {
    return this.quoteDeliveryService.openByToken(token)
  }

  @Post('q/:token/accept')
  acceptQuote(@Param('token') token: string) {
    return this.quoteDeliveryService.acceptByToken(token)
  }

  @Post('quotes/:deliveryId/resend')
  resendQuote(@Param('deliveryId') deliveryId: string) {
    return this.quoteDeliveryService.resend(deliveryId)
  }

  @Get('quote-deliveries')
  findAll() {
    return this.quoteDeliveryService.findAll()
  }
}
