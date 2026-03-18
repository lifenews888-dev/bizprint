import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DesignRequest, DesignStatus } from './design-request.entity'
import { MailService } from '../mail/mail.service'
import { WalletService } from '../wallet/wallet.service'
import { SettingsService } from '../settings/settings.service'

const DEFAULT_DESIGNER_FEE = 15000
const DEFAULT_TAX_PERCENT = 10

@Injectable()
export class DesignRequestsService {
  constructor(
    @InjectRepository(DesignRequest)
    private repo: Repository<DesignRequest>,
    private mailService: MailService,
    private walletService: WalletService,
    private settingsService: SettingsService,
  ) {}

  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }) }
  findByOrder(order_id: string) { return this.repo.find({ where: { order_id } }) }
  findByDesigner(designer_id: string) { return this.repo.find({ where: { designer_id }, order: { created_at: 'DESC' } }) }
  findByCustomer(customer_id: string) { return this.repo.find({ where: { customer_id }, order: { created_at: 'DESC' } }) }
  findPending() { return this.repo.find({ where: { status: DesignStatus.PENDING }, order: { created_at: 'ASC' } }) }
  findOne(id: string) { return this.repo.findOne({ where: { id } }) }

  create(data: Partial<DesignRequest>) {
    return this.repo.save(this.repo.create({ ...data, status: DesignStatus.PENDING }))
  }

  async assign(id: string, designerId: string, designerName: string, designerPhone?: string, designerZoom?: string) {
    await this.repo.update(id, {
      designer_id: designerId,
      designer_name: designerName,
      designer_phone: designerPhone,
      designer_zoom: designerZoom,
      status: DesignStatus.ASSIGNED,
    })
    const dr = await this.findOne(id)
    if (dr && dr.customer_email) {
      this.mailService.sendDesignerAssigned({
        to: dr.customer_email,
        customerName: dr.customer_name || 'Customer',
        designerName: designerName,
        productName: dr.product_name || 'Product',
        orderId: dr.order_id,
        zoomLink: designerZoom,
      }).catch(() => {})
    }
    return dr
  }

  async submitFile(id: string, fileUrl: string, previewUrl?: string) {
    await this.repo.update(id, {
      status: DesignStatus.IN_PROGRESS,
      file_url: fileUrl,
      preview_url: previewUrl,
    })
    return this.findOne(id)
  }

  async approve(id: string) {
    await this.repo.update(id, { status: DesignStatus.APPROVED })
    const dr = await this.findOne(id)

    // Designer wallet credit on approval
    if (dr && dr.designer_id) {
      await this.processDesignerPayment(dr)
    }

    if (dr && dr.customer_email) {
      this.mailService.sendDesignApproved({
        to: dr.customer_email,
        customerName: dr.customer_name || 'Customer',
        productName: dr.product_name || 'Product',
        orderId: dr.order_id,
      }).catch(() => {})
    }
    return dr
  }

  async reject(id: string, reason: string) {
    await this.repo.update(id, { status: DesignStatus.REJECTED, reject_reason: reason })
    return this.findOne(id)
  }

  async update(id: string, data: Partial<DesignRequest>) {
    await this.repo.update(id, data)
    return this.findOne(id)
  }

  async remove(id: string) {
    await this.repo.delete(id)
    return { deleted: true }
  }

  private async processDesignerPayment(dr: DesignRequest) {
    try {
      const designerId = dr.designer_id

      // Get fee from settings — per-designer custom rate or default
      const customFeeSetting = await this.settingsService.get(`designer_fee_${designerId}`)
      const defaultFeeSetting = await this.settingsService.get('designer_fee_per_job')
      const taxSetting = await this.settingsService.get('tax_haoat_percent')

      const grossFee = customFeeSetting
        ? parseFloat(customFeeSetting)
        : defaultFeeSetting
          ? parseFloat(defaultFeeSetting)
          : DEFAULT_DESIGNER_FEE

      const taxPercent = taxSetting ? parseFloat(taxSetting) : DEFAULT_TAX_PERCENT
      const taxAmount = Math.round(grossFee * taxPercent / 100)
      const netFee = grossFee - taxAmount

      await this.walletService.credit(
        designerId,
        netFee,
        'design_fee',
        dr.id,
        `Design #${dr.id.slice(0, 8)} fee: ${grossFee} - ${taxPercent}% HAOAT (${taxAmount}) = ${netFee}`,
      )

      console.log(`Designer ${designerId} paid: ${netFee} (gross: ${grossFee}, tax: ${taxAmount})`)
    } catch (e) {
      console.log('Designer payment error:', e.message)
    }
  }
}
