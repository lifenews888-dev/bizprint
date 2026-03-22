import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Cart, CartStatus } from './cart.entity'
import { CartItem } from './entities/cart-item.entity'
import { Quotation } from '../quote/entities/quotation.entity'
import { QuotationItem } from '../quote/entities/quotation-item.entity'
import { Order, OrderStatus } from '../orders/entities/order.entity'
import { OrderItem } from '../orders/entities/order-item.entity'
import { OrderVendorGroup } from '../orders/entities/order-vendor-group.entity'
import { PricingService } from '../quote/pricing.service'
import { QuoteService } from '../quote/quote.service'
import { EventsLogService } from '../events/events.service'

@Injectable()
export class CartService {

  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private itemRepo: Repository<CartItem>,

    @InjectRepository(Quotation)
    private quotationRepo: Repository<Quotation>,

    @InjectRepository(QuotationItem)
    private quotationItemRepo: Repository<QuotationItem>,

    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,

    @InjectRepository(OrderVendorGroup)
    private vendorGroupRepo: Repository<OrderVendorGroup>,

    private pricingService: PricingService,
    private quoteService: QuoteService,
    private eventsLog: EventsLogService,
  ) {}

  // ── Get or create active cart ──────────────────────────────────────────────
  async getOrCreateCart(customerId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { customer_id: customerId, status: CartStatus.ACTIVE },
      relations: ['items'],
    })
    if (!cart) {
      cart = await this.cartRepo.save(
        this.cartRepo.create({ customer_id: customerId, status: CartStatus.ACTIVE }),
      )
      cart.items = []
    }
    return cart
  }

  async getCart(customerId: string) {
    return this.cartRepo.findOne({
      where: { customer_id: customerId, status: CartStatus.ACTIVE },
      relations: ['items'],
    })
  }

  // ── POST /cart/items ───────────────────────────────────────────────────────
  async addItem(customerId: string, data: { product_id: string; quantity: number; specs?: Record<string, any> }) {
    const cart = await this.getOrCreateCart(customerId)

    const item = this.itemRepo.create({
      cart_id: cart.id,
      product_id: data.product_id,
      quantity: data.quantity || 1,
      specs: data.specs || null,
    })
    const saved = await this.itemRepo.save(item)

    await this.eventsLog.log({
      entity_type: 'cart',
      entity_id: cart.id,
      action: 'item_added',
      new_value: { product_id: data.product_id, quantity: data.quantity },
      actor_id: customerId,
      actor_type: 'user',
    })

    return saved
  }

  async removeItem(itemId: string) {
    return this.itemRepo.delete(itemId)
  }

  // ── POST /cart/quote ───────────────────────────────────────────────────────
  async generateQuote(customerId: string) {
    const cart = await this.cartRepo.findOne({
      where: { customer_id: customerId, status: CartStatus.ACTIVE },
      relations: ['items'],
    })
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Сагс хоосон байна')
    }

    // Calculate pricing for each item
    const itemPricings = await Promise.all(
      cart.items.map(async (item) => {
        const pricing = await this.pricingService.calculateFullPrice(
          Number(item.unit_price || 0),
          { product_id: item.product_id },
        )
        return { item, pricing }
      }),
    )

    // Create Quotation
    const quoteNumber = await this.quoteService.generateNumber()
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 3)

    const totalPrice = itemPricings.reduce(
      (sum, { item, pricing }) => sum + pricing.customer_price * item.quantity,
      0,
    )

    const quotation = await this.quotationRepo.save(
      this.quotationRepo.create({
        quote_number: quoteNumber,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        quantity: cart.items.reduce((sum, i) => sum + i.quantity, 0),
        total_price: totalPrice,
        user_id: customerId,
        status: 'draft',
        valid_until: validUntil,
      }),
    )

    // Create QuotationItems
    for (const { item, pricing } of itemPricings) {
      await this.quotationItemRepo.save(
        this.quotationItemRepo.create({
          quotation_id: quotation.id,
          product_id: item.product_id,
          quantity: item.quantity,
          vendor_cost: pricing.vendor_cost,
          margin_rate: pricing.margin_rate,
          customer_price: pricing.customer_price,
          specs: item.specs,
        }),
      )
    }

    await this.eventsLog.log({
      entity_type: 'quotation',
      entity_id: quotation.id,
      action: 'created',
      new_value: { cart_id: cart.id, item_count: cart.items.length, total_price: totalPrice },
      actor_id: customerId,
      actor_type: 'user',
    })

    return this.quotationRepo.findOne({
      where: { id: quotation.id },
      relations: ['items'],
    })
  }

  // ── POST /cart/quote/confirm ───────────────────────────────────────────────
  async confirmQuote(customerId: string, quotationId: string, paymentMethod?: string) {
    const quotation = await this.quotationRepo.findOne({
      where: { id: quotationId },
      relations: ['items'],
    })
    if (!quotation) throw new NotFoundException('Үнийн санал олдсонгүй')
    if (quotation.status !== 'draft') {
      throw new BadRequestException(`Үнийн санал "${quotation.status}" төлөвтэй байна — зөвхөн "draft" батлах боломжтой`)
    }

    // Create Order
    const order = await this.orderRepo.save(
      this.orderRepo.create({
        customer_id: customerId,
        quote_id: quotation.id,
        quote_number: quotation.quote_number,
        quantity: quotation.quantity,
        total_price: quotation.total_price,
        unit_price: quotation.unit_price,
        payment_method: paymentMethod || 'pending',
        payment_status: 'pending',
        status: OrderStatus.DRAFT,
        notes: `Quote ${quotation.quote_number}-аас үүсгэгдсэн`,
      }),
    )

    // Group items by vendor (via specs.vendor_id if present, else default group)
    const vendorGroups = new Map<string, QuotationItem[]>()
    for (const qi of quotation.items || []) {
      const vendorId = qi.specs?.vendor_id || 'default'
      if (!vendorGroups.has(vendorId)) vendorGroups.set(vendorId, [])
      vendorGroups.get(vendorId)!.push(qi)
    }

    // Create OrderVendorGroups + OrderItems
    for (const [vendorId, items] of vendorGroups) {
      let vendorGroup: OrderVendorGroup | null = null
      if (vendorId !== 'default') {
        vendorGroup = await this.vendorGroupRepo.save(
          this.vendorGroupRepo.create({
            order_id: order.id,
            vendor_id: vendorId,
            subtotal: items.reduce((s, i) => s + Number(i.customer_price) * i.quantity, 0),
            status: 'pending',
            assigned_at: new Date(),
          }),
        )
      }

      for (const qi of items) {
        await this.orderItemRepo.save(
          this.orderItemRepo.create({
            order_id: order.id,
            product_id: qi.product_id,
            vendor_group_id: vendorGroup?.id || null,
            quantity: qi.quantity,
            unit_price: qi.customer_price,
            total_price: Number(qi.customer_price) * qi.quantity,
            specs: qi.specs,
          }),
        )
      }
    }

    // Update quotation status
    await this.quotationRepo.update(quotationId, { status: 'ordered' })

    // Convert cart
    const cart = await this.cartRepo.findOne({
      where: { customer_id: customerId, status: CartStatus.ACTIVE },
    })
    if (cart) {
      await this.cartRepo.update(cart.id, { status: CartStatus.CONVERTED })
    }

    await this.eventsLog.log({
      entity_type: 'order',
      entity_id: order.id,
      action: 'created_from_quote',
      new_value: { quotation_id: quotationId, quote_number: quotation.quote_number },
      actor_id: customerId,
      actor_type: 'user',
    })

    return this.orderRepo.findOne({
      where: { id: order.id },
      relations: ['items', 'vendor_groups'],
    })
  }
}
