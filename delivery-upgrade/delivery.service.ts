import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Delivery, DeliveryStatus } from './delivery.entity'
import { MailService } from '../mail/mail.service'
import { WalletService } from '../wallet/wallet.service'
import { SettingsService } from '../settings/settings.service'
import { WebhookService } from './webhook.service'

const DEFAULT_COURIER_FEE = 5000
const DEFAULT_TAX_PERCENT = 10

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name)

  constructor(
    @InjectRepository(Delivery)
    private repo: Repository<Delivery>,
    private mailService: MailService,
    private walletService: WalletService,
    private settingsService: SettingsService,
    private webhookService: WebhookService,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['order', 'order.customer'],
      order: { created_at: 'DESC' },
    })
  }

  findByOrder(orderId: number) {
    return this.repo.findOne({
      where: { order: { id: orderId } as any },
      relations: ['order'],
    })
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['order'],
    })
  }

  async create(data: Partial<Delivery>) {
    const delivery = this.repo.create(data)
    const saved = await this.repo.save(delivery)

    // Load relations
    const full = await this.findOne(saved.id)

    // Trigger webhook
    this.webhookService.trigger('delivery_created', {
      delivery_id: saved.id,
      order_id: (full?.order as any)?.id,
      status: saved.status,
      address: saved.address,
      recipient_name: saved.recipient_name,
      recipient_phone: saved.recipient_phone,
    })

    return saved
  }

  async updateStatus(id: number, status: DeliveryStatus) {
    const delivery = await this.repo.findOne({
      where: { id },
      relations: ['order'],
    })
    if (!delivery) throw new NotFoundException('Delivery not found')

    const previousStatus = delivery.status
    delivery.status = status
    await this.repo.save(delivery)

    // Trigger webhook for status change
    this.webhookService.trigger('status_changed', {
      delivery_id: id,
      order_id: (delivery.order as any)?.id,
      previous_status: previousStatus,
      new_status: status,
      provider: delivery.provider,
      provider_order_id: delivery.provider_order_id,
    })

    if (status === DeliveryStatus.DELIVERED && delivery.order) {
      const order = delivery.order as any

      // Trigger delivery completed webhook
      this.webhookService.trigger('delivery_completed', {
        delivery_id: id,
        order_id: order.id,
        customer_name: order.customer_name,
        product_name: order.product_name,
      })

      // Email notification
      const email = order.customer_email
      if (email) {
        this.mailService.sendDeliveryCompleted({
          to: email,
          customerName: order.customer_name || 'Customer',
          productName: order.product_name || 'Product',
        }).catch(() => {})
      }

      // Courier wallet credit
      if (delivery.courier_id) {
        await this.processCourierPayment(delivery)
      }
    }

    return delivery
  }

  // External provider creates delivery and sends back their tracking info
  async createFromProvider(data: {
    order_id: string
    provider: string
    provider_order_id: string
    provider_tracking_url?: string
    provider_data?: Record<string, any>
    courier_name?: string
    courier_phone?: string
    estimated_at?: string
  }) {
    const delivery = await this.repo.findOne({
      where: { order: { id: data.order_id } as any },
    })

    if (delivery) {
      // Update existing delivery with provider info
      delivery.provider = data.provider
      delivery.provider_order_id = data.provider_order_id
      delivery.provider_tracking_url = data.provider_tracking_url || null
      delivery.provider_data = data.provider_data || null
      delivery.courier_name = data.courier_name || delivery.courier_name
      delivery.courier_phone = data.courier_phone || delivery.courier_phone
      delivery.status = DeliveryStatus.ASSIGNED
      if (data.estimated_at) delivery.estimated_at = new Date(data.estimated_at)
      return this.repo.save(delivery)
    }

    // Create new delivery with provider info
    const newDelivery = this.repo.create({
      order: { id: data.order_id } as any,
      provider: data.provider,
      provider_order_id: data.provider_order_id,
      provider_tracking_url: data.provider_tracking_url,
      provider_data: data.provider_data,
      courier_name: data.courier_name,
      courier_phone: data.courier_phone,
      status: DeliveryStatus.ASSIGNED,
      estimated_at: data.estimated_at ? new Date(data.estimated_at) : null,
    })
    return this.repo.save(newDelivery)
  }

  // External provider updates status via callback
  async providerCallback(providerOrderId: string, data: {
    status: string
    courier_name?: string
    courier_phone?: string
    lat?: number
    lng?: number
    note?: string
    estimated_at?: string
  }) {
    const delivery = await this.repo.findOne({
      where: { provider_order_id: providerOrderId },
      relations: ['order'],
    })
    if (!delivery) throw new NotFoundException(`Delivery not found for provider order: ${providerOrderId}`)

    // Map external status to our status
    const statusMap: Record<string, DeliveryStatus> = {
      'pending': DeliveryStatus.PENDING,
      'assigned': DeliveryStatus.ASSIGNED,
      'accepted': DeliveryStatus.ASSIGNED,
      'picking_up': DeliveryStatus.PICKED_UP,
      'picked_up': DeliveryStatus.PICKED_UP,
      'on_the_way': DeliveryStatus.ON_THE_WAY,
      'in_transit': DeliveryStatus.IN_TRANSIT,
      'delivering': DeliveryStatus.IN_TRANSIT,
      'delivered': DeliveryStatus.DELIVERED,
      'completed': DeliveryStatus.DELIVERED,
      'failed': DeliveryStatus.FAILED,
      'cancelled': DeliveryStatus.CANCELLED,
    }

    const mappedStatus = statusMap[data.status.toLowerCase()] || delivery.status

    if (data.courier_name) delivery.courier_name = data.courier_name
    if (data.courier_phone) delivery.courier_phone = data.courier_phone
    if (data.lat) delivery.lat = data.lat
    if (data.lng) delivery.lng = data.lng
    if (data.note) delivery.note = data.note
    if (data.estimated_at) delivery.estimated_at = new Date(data.estimated_at)

    // Use updateStatus to trigger all hooks
    if (mappedStatus !== delivery.status) {
      return this.updateStatus(delivery.id, mappedStatus)
    }

    return this.repo.save(delivery)
  }

  // Get tracking info (for customers)
  async getTracking(deliveryId: number) {
    const delivery = await this.repo.findOne({
      where: { id: deliveryId },
      relations: ['order'],
    })
    if (!delivery) throw new NotFoundException('Delivery not found')

    return {
      id: delivery.id,
      status: delivery.status,
      courier_name: delivery.courier_name,
      courier_phone: delivery.courier_phone,
      provider: delivery.provider,
      tracking_url: delivery.provider_tracking_url,
      estimated_at: delivery.estimated_at,
      lat: delivery.lat,
      lng: delivery.lng,
      address: delivery.address,
      created_at: delivery.created_at,
      updated_at: delivery.updated_at,
    }
  }

  private async processCourierPayment(delivery: Delivery) {
    try {
      const courierId = String(delivery.courier_id)
      const feeSetting = await this.settingsService.get('courier_fee_per_delivery')
      const taxSetting = await this.settingsService.get('tax_haoat_percent')
      const grossFee = feeSetting ? parseFloat(feeSetting) : DEFAULT_COURIER_FEE
      const taxPercent = taxSetting ? parseFloat(taxSetting) : DEFAULT_TAX_PERCENT
      const taxAmount = Math.round(grossFee * taxPercent / 100)
      const netFee = grossFee - taxAmount
      await this.walletService.credit(courierId, netFee, 'delivery_fee', String(delivery.id), `Delivery #${delivery.id} fee: ${grossFee} - ${taxPercent}% tax (${taxAmount}) = ${netFee}`)
      this.logger.log(`Courier ${courierId} paid: ${netFee}`)
    } catch (e) {
      this.logger.error('Courier payment error:', e.message)
    }
  }
}
