import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Delivery, DeliveryStatus } from './delivery.entity'
import { MailService } from '../mail/mail.service'
import { WalletService } from '../wallet/wallet.service'
import { SettingsService } from '../settings/settings.service'

const DEFAULT_COURIER_FEE = 5000
const DEFAULT_TAX_PERCENT = 10

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private repo: Repository<Delivery>,
    private mailService: MailService,
    private walletService: WalletService,
    private settingsService: SettingsService,
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

  create(data: Partial<Delivery>) {
    const delivery = this.repo.create(data)
    return this.repo.save(delivery)
  }

  async updateStatus(id: number, status: DeliveryStatus) {
    const delivery = await this.repo.findOne({
      where: { id },
      relations: ['order'],
    })
    if (!delivery) throw new NotFoundException('Delivery not found')
    delivery.status = status
    await this.repo.save(delivery)

    if (status === DeliveryStatus.DELIVERED && delivery.order) {
      const order = delivery.order as any

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

  private async processCourierPayment(delivery: Delivery) {
    try {
      const courierId = String(delivery.courier_id)

      // Get fee and tax from settings
      const feeSetting = await this.settingsService.get('courier_fee_per_delivery')
      const taxSetting = await this.settingsService.get('tax_haoat_percent')

      const grossFee = feeSetting ? parseFloat(feeSetting) : DEFAULT_COURIER_FEE
      const taxPercent = taxSetting ? parseFloat(taxSetting) : DEFAULT_TAX_PERCENT
      const taxAmount = Math.round(grossFee * taxPercent / 100)
      const netFee = grossFee - taxAmount

      // Credit courier wallet (net after tax)
      await this.walletService.credit(
        courierId,
        netFee,
        'delivery_fee',
        String(delivery.id),
        `Delivery #${delivery.id} fee: ${grossFee} - ${taxPercent}% tax (${taxAmount}) = ${netFee}`,
      )

      console.log(`Courier ${courierId} paid: ${netFee} (gross: ${grossFee}, tax: ${taxAmount})`)
    } catch (e) {
      console.log('Courier payment error:', e.message)
    }
  }
}
