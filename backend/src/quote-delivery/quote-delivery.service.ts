import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { createHash, randomBytes } from 'crypto'
import { QuoteDelivery, QuoteDeliveryChannel, QuoteDeliveryStatus } from './quote-delivery.entity'

export interface SendQuoteDeliveryInput {
  quote_id: string
  recipient_email?: string
  recipient_phone?: string
  delivery_channel?: QuoteDeliveryChannel
  validity_hours?: number
}

@Injectable()
export class QuoteDeliveryService {
  constructor(
    @InjectRepository(QuoteDelivery)
    private readonly quoteDeliveryRepo: Repository<QuoteDelivery>,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private createPublicToken(): string {
    return randomBytes(32).toString('base64url')
  }

  async sendQuote(input: SendQuoteDeliveryInput) {
    if (!input.quote_id) throw new BadRequestException('quote_id is required')
    if (!input.recipient_email && !input.recipient_phone) {
      throw new BadRequestException('recipient_email or recipient_phone is required')
    }

    const token = this.createPublicToken()
    const tokenHash = this.hashToken(token)
    const validityHours = input.validity_hours ?? 72
    const expiresAt = new Date(Date.now() + validityHours * 60 * 60 * 1000)

    const delivery = this.quoteDeliveryRepo.create({
      quote_id: input.quote_id,
      recipient_email: input.recipient_email,
      recipient_phone: input.recipient_phone,
      delivery_channel: input.delivery_channel ?? QuoteDeliveryChannel.EMAIL,
      status: QuoteDeliveryStatus.SENT,
      public_token_hash: tokenHash,
      sent_at: new Date(),
      expires_at: expiresAt,
    })

    const saved = await this.quoteDeliveryRepo.save(delivery)

    return {
      ...saved,
      public_token: token,
      public_url: `/q/${token}`,
      note: 'Email/SMS transport can be connected to MailModule or messaging provider next.',
    }
  }

  async openByToken(token: string) {
    const delivery = await this.findValidByToken(token)

    if (delivery.status === QuoteDeliveryStatus.SENT) {
      delivery.status = QuoteDeliveryStatus.OPENED
      delivery.opened_at = new Date()
      await this.quoteDeliveryRepo.save(delivery)
    }

    return {
      id: delivery.id,
      quote_id: delivery.quote_id,
      status: delivery.status,
      recipient_email: delivery.recipient_email,
      recipient_phone: delivery.recipient_phone,
      expires_at: delivery.expires_at,
    }
  }

  async acceptByToken(token: string) {
    const delivery = await this.findValidByToken(token)

    if (delivery.status === QuoteDeliveryStatus.CANCELLED) {
      throw new BadRequestException('Quote delivery is cancelled')
    }

    delivery.status = QuoteDeliveryStatus.ACCEPTED
    delivery.accepted_at = new Date()
    if (!delivery.opened_at) delivery.opened_at = new Date()

    const saved = await this.quoteDeliveryRepo.save(delivery)

    return {
      id: saved.id,
      quote_id: saved.quote_id,
      status: saved.status,
      accepted_at: saved.accepted_at,
      next_step: 'Generate contract from accepted quote.',
    }
  }

  async resend(id: string) {
    const delivery = await this.quoteDeliveryRepo.findOne({ where: { id } })
    if (!delivery) throw new NotFoundException('Quote delivery not found')

    const token = this.createPublicToken()
    delivery.public_token_hash = this.hashToken(token)
    delivery.status = QuoteDeliveryStatus.SENT
    delivery.sent_at = new Date()
    delivery.opened_at = null
    delivery.accepted_at = null
    delivery.expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000)

    const saved = await this.quoteDeliveryRepo.save(delivery)

    return {
      ...saved,
      public_token: token,
      public_url: `/q/${token}`,
    }
  }

  async findAll() {
    return this.quoteDeliveryRepo.find({ order: { created_at: 'DESC' } })
  }

  private async findValidByToken(token: string) {
    if (!token) throw new BadRequestException('token is required')

    const tokenHash = this.hashToken(token)
    const delivery = await this.quoteDeliveryRepo.findOne({ where: { public_token_hash: tokenHash } })
    if (!delivery) throw new NotFoundException('Quote delivery not found')

    if (delivery.expires_at && delivery.expires_at.getTime() < Date.now()) {
      delivery.status = QuoteDeliveryStatus.EXPIRED
      await this.quoteDeliveryRepo.save(delivery)
      throw new BadRequestException('Quote link expired')
    }

    return delivery
  }
}
