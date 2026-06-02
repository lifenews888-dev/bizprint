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
import { Product } from '../products/product.entity'
import { User } from '../users/user.entity'
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

    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

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
    const cart = await this.cartRepo.findOne({
      where: { customer_id: customerId, status: CartStatus.ACTIVE },
      relations: ['items', 'items.product'],
    })

    return this.formatCartResponse(cart)
  }

  // ── POST /cart/items ───────────────────────────────────────────────────────
  async addItem(customerId: string, data: { product_id: string; quantity: number; unit_price?: number; specs?: Record<string, any> }) {
    // Stock guard: refuse to add items that don't exist, are inactive, are
    // explicitly out of stock, or would exceed the available stock_quantity
    // (when the vendor tracks finite inventory).
    const product = await this.productRepo.findOne({ where: { id: data.product_id } })
    if (!product) throw new NotFoundException('Бүтээгдэхүүн олдсонгүй')
    if (!product.is_active) throw new BadRequestException('Энэ бүтээгдэхүүн идэвхгүй байна')
    if (product.is_out_of_stock) throw new BadRequestException('Бүтээгдэхүүн дууссан байна')
    const requestedQty = Math.max(1, Number(data.quantity) || 1)
    if (product.stock_quantity != null && requestedQty > product.stock_quantity) {
      throw new BadRequestException(
        `Зөвхөн ${product.stock_quantity} ширхэг бэлэн байна (та ${requestedQty} хүссэн)`,
      )
    }

    const cart = await this.getOrCreateCart(customerId)
    const specs = data.specs || {}
    const pricingInput = this.normalizeCartItemPricing(product, specs, data.unit_price, requestedQty)
    const unitPrice = pricingInput.unitPrice
    if (unitPrice <= 0) {
      throw new BadRequestException('Бүтээгдэхүүний үнэ 0 байна')
    }
    const pricingSpecs = {
      ...(specs.pricing || {}),
      unit_price: unitPrice,
      total_price: Math.round(unitPrice * requestedQty),
      quantity: requestedQty,
      vat_included: specs?.pricing?.vat_included ?? true,
      source: pricingInput.source,
      pricingEngine: pricingInput.pricingEngine,
      pricingContractVersion: pricingInput.pricingContractVersion,
      pricing_validation: pricingInput.validation,
    }

    const item = this.itemRepo.create({
      cart_id: cart.id,
      product_id: data.product_id,
      quantity: requestedQty,
      unit_price: unitPrice,
      specs: { ...specs, pricing: pricingSpecs },
    })
    const saved = await this.itemRepo.save(item)

    await this.eventsLog.log({
      entity_type: 'cart',
      entity_id: cart.id,
      action: 'item_added',
      new_value: { product_id: data.product_id, quantity: requestedQty, unit_price: unitPrice },
      actor_id: customerId,
      actor_type: 'user',
    })

    return saved
  }

  async removeItem(customerId: string, itemId: string) {
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
      relations: ['cart'],
    })
    if (!item || item.cart?.customer_id !== customerId || item.cart?.status !== CartStatus.ACTIVE) {
      throw new NotFoundException('Сагсны бараа олдсонгүй')
    }
    const result = await this.itemRepo.delete(itemId)
    await this.eventsLog.log({
      entity_type: 'cart',
      entity_id: item.cart_id,
      action: 'item_removed',
      old_value: { item_id: itemId, product_id: item.product_id, quantity: item.quantity },
      actor_id: customerId,
      actor_type: 'user',
    })
    return result
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

    // Cart items store customer-facing unit prices. Do not apply another
    // margin here, otherwise product-page prices become inflated at checkout.
    const itemPricings = await Promise.all(
      cart.items.map(async (item) => {
        let unitPrice = Number(item.unit_price || item.specs?.pricing?.unit_price || 0)
        if (unitPrice <= 0) {
          const product = await this.productRepo.findOne({ where: { id: item.product_id } })
          unitPrice = Number(product?.sale_price ?? product?.base_price ?? 0)
        }
        if (unitPrice <= 0) throw new BadRequestException('Сагсны бүтээгдэхүүний үнэ 0 байна')
        const vendorCost = Number(item.specs?.pricing?.vendor_cost ?? unitPrice)
        const pricing = {
          vendor_cost: vendorCost,
          margin_rate: Number(item.specs?.pricing?.margin_rate ?? 0),
          customer_price: Math.round(unitPrice),
        }
        return { item, pricing }
      }),
    )

    // Create Quotation
    const quoteNumber = await this.quoteService.generateNumber()
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 3)

    const totalQuantity = cart.items.reduce((sum, i) => sum + i.quantity, 0)
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
        quantity: totalQuantity,
        unit_price: totalQuantity > 0 ? Math.round(totalPrice / totalQuantity) : 0,
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
  async confirmQuote(customerId: string, quotationId: string, paymentMethod?: string, referralCode?: string) {
    const quotation = await this.quotationRepo.findOne({
      where: { id: quotationId },
      relations: ['items'],
    })
    if (!quotation || quotation.user_id !== customerId) throw new NotFoundException('Үнийн санал олдсонгүй')
    if (quotation.status !== 'draft') {
      throw new BadRequestException(`Үнийн санал "${quotation.status}" төлөвтэй байна — зөвхөн "draft" батлах боломжтой`)
    }

    // Sales attribution: prefer the customer's referred_by_sales_id (set
    // when they registered via /register?ref=CODE or visited an agent's
    // storefront before signing up). Fall back to the referral code passed
    // in the request — that handles the case where a logged-in customer
    // followed an agent's link without re-registering. We persist the
    // backfill onto the user too so subsequent orders inherit it.
    const customer = await this.userRepo.findOne({ where: { id: customerId } }).catch(() => null)
    let salesAgentId = customer?.referred_by_sales_id || null
    if (!salesAgentId && referralCode) {
      const code = referralCode.trim().toUpperCase()
      // Look up the referral by code via raw queryBuilder to avoid an
      // import cycle through the referral module.
      const ref = await this.userRepo.manager
        .createQueryBuilder()
        .select('r.sales_user_id', 'sales_user_id')
        .from('referrals', 'r')
        .where('r.code = :code AND r.is_active = true', { code })
        .getRawOne().catch(() => null)
      if (ref?.sales_user_id) {
        salesAgentId = ref.sales_user_id
        // Backfill onto the user so future orders are credited too —
        // matches what /register would have done if the customer had used
        // the link earlier.
        if (customer) {
          await this.userRepo.update(customer.id, {
            referred_by_sales_id: salesAgentId as string,
            referral_code_used: code,
          }).catch(() => {})
        }
      }
    }

    const quotePricingValidation = this.validateQuotationTotals(quotation)

    // Create Order
    const order = await this.orderRepo.save(
      this.orderRepo.create({
        customer_id: customerId,
        quote_id: quotation.id,
        quote_number: quotation.quote_number,
        quantity: quotePricingValidation.quantity,
        total_price: quotePricingValidation.total_price,
        unit_price: quotePricingValidation.unit_price,
        payment_method: paymentMethod || 'pending',
        payment_status: 'pending',
        status: OrderStatus.DRAFT,
        sales_agent_id: salesAgentId || undefined,
        options: {
          quote_pricing_validation: quotePricingValidation.validation,
        },
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
      new_value: {
        quotation_id: quotationId,
        quote_number: quotation.quote_number,
        total_price: quotePricingValidation.total_price,
        pricing_validation: quotePricingValidation.validation,
      },
      actor_id: customerId,
      actor_type: 'user',
    })

    return this.orderRepo.findOne({
      where: { id: order.id },
      relations: ['items', 'vendor_groups'],
    })
  }

  private formatCartResponse(cart: Cart | null) {
    if (!cart) {
      return {
        items: [],
        total: 0,
        total_price: 0,
        subtotal_excl_vat: 0,
        vat: 0,
        vat_rate: 0.1,
        vat_included: true,
      }
    }

    const items = (cart.items || []).map((item) => {
      const specs = item.specs || {}
      const product = item.product
      const qty = Math.max(1, Number(item.quantity) || 1)
      const unitPrice = this.roundMoney(
        Number(item.unit_price ?? specs?.pricing?.unit_price ?? product?.sale_price ?? product?.base_price ?? 0),
      )
      const totalPrice = this.roundMoney(unitPrice * qty)
      const image = specs.image
        || specs.product_image
        || product?.thumbnail_url
        || (Array.isArray(product?.images) ? product.images[0] : undefined)

      return {
        id: item.id,
        productId: item.product_id,
        product_id: item.product_id,
        name: specs.product_name || specs.name || product?.name_mn || product?.name || 'Бүтээгдэхүүн',
        price: unitPrice,
        qty,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
        image,
        options: this.formatCartOptions(specs),
        specs,
      }
    })

    const total = this.roundMoney(items.reduce((sum, item) => sum + item.total_price, 0))
    const vatSplit = this.splitIncludedVat(total)
    const pricingAudit = this.summarizeCartPricingAudit(items)

    return {
      id: cart.id,
      customer_id: cart.customer_id,
      status: cart.status,
      items,
      total,
      total_price: total,
      subtotal_excl_vat: vatSplit.subtotal_excl_vat,
      vat: vatSplit.vat,
      vat_rate: vatSplit.vat_rate,
      vat_included: true,
      pricing_audit: pricingAudit,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
    }
  }

  private summarizeCartPricingAudit(items: Array<{ specs?: Record<string, any> }>) {
    const summary = {
      total_items: items.length,
      accepted_count: 0,
      adjusted_count: 0,
      missing_count: 0,
      dynamic_count: 0,
      catalog_count: 0,
      has_adjustments: false,
      all_priced: true,
    }

    for (const item of items) {
      const specs = item.specs || {}
      const pricing = specs.pricing || {}
      const snapshot = specs.pricing_snapshot || {}
      const validation = pricing.pricing_validation || {}
      const source = String(validation.source || pricing.source || snapshot.source || 'unknown')
      const status = String(validation.status || '')

      if (source === 'catalog') summary.catalog_count += 1
      if (['pricing-catalog', 'ai-upload', 'server', 'quote', 'inquiry'].includes(source)) {
        summary.dynamic_count += 1
      }

      if (status === 'accepted') summary.accepted_count += 1
      else if (status === 'adjusted') summary.adjusted_count += 1
      else summary.missing_count += 1
    }

    summary.has_adjustments = summary.adjusted_count > 0
    summary.all_priced = summary.missing_count === 0
    return summary
  }

  private normalizeCartItemPricing(
    product: Product,
    specs: Record<string, any>,
    submittedUnitPrice: unknown,
    quantity: number,
  ) {
    const snapshot = specs?.pricing_snapshot || {}
    const pricing = specs?.pricing || {}
    const source = String(snapshot.source || pricing.source || 'catalog')
    const pricingEngine = String(snapshot.pricingEngine || pricing.pricingEngine || `cart.${source}`)
    const pricingContractVersion = snapshot.pricingContractVersion || pricing.pricingContractVersion || null
    const submitted = this.roundMoney(Number(submittedUnitPrice ?? pricing.unit_price ?? 0))
    const catalog = this.roundMoney(Number(product.sale_price ?? product.base_price ?? 0))
    const pricingMode = String(product.pricing_mode || 'fixed')
    const dynamicSource = ['pricing-catalog', 'ai-upload', 'server', 'quote', 'inquiry'].includes(source)
    const shouldUseCatalog = !dynamicSource && pricingMode === 'fixed' && catalog > 0
    const unitPrice = shouldUseCatalog ? catalog : (submitted > 0 ? submitted : catalog)
    const delta = submitted > 0 ? this.roundMoney(submitted - unitPrice) : 0

    return {
      unitPrice,
      source,
      pricingEngine,
      pricingContractVersion,
      validation: {
        status: delta === 0 ? 'accepted' : 'adjusted',
        source,
        pricing_mode: pricingMode,
        submitted_unit_price: submitted,
        catalog_unit_price: catalog,
        accepted_unit_price: unitPrice,
        quantity,
        delta,
        validated_at: new Date().toISOString(),
      },
    }
  }

  private validateQuotationTotals(quotation: Quotation) {
    const items = quotation.items || []
    const computedQuantity = items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0)
    const computedTotal = this.roundMoney(
      items.reduce((sum, item) => sum + Number(item.customer_price || 0) * Math.max(1, Number(item.quantity) || 1), 0),
    )
    const headerQuantity = Math.max(1, Number(quotation.quantity) || 1)
    const headerTotal = this.roundMoney(Number(quotation.total_price || 0))
    const quantity = computedQuantity > 0 ? computedQuantity : headerQuantity
    const totalPrice = computedTotal > 0 ? computedTotal : headerTotal
    const unitPrice = quantity > 0 ? this.roundMoney(totalPrice / quantity) : this.roundMoney(Number(quotation.unit_price || 0))
    const delta = this.roundMoney(headerTotal - totalPrice)

    return {
      quantity,
      total_price: totalPrice,
      unit_price: unitPrice,
      validation: {
        status: delta === 0 ? 'accepted' : 'adjusted',
        header_total_price: headerTotal,
        item_total_price: computedTotal,
        accepted_total_price: totalPrice,
        header_quantity: headerQuantity,
        item_quantity: computedQuantity,
        accepted_quantity: quantity,
        delta,
        validated_at: new Date().toISOString(),
      },
    }
  }

  private splitIncludedVat(total: number) {
    const vatRate = 0.1
    const subtotalExclVat = this.roundMoney(total / (1 + vatRate))
    return {
      subtotal_excl_vat: subtotalExclVat,
      vat: this.roundMoney(total - subtotalExclVat),
      vat_rate: vatRate,
    }
  }

  private formatCartOptions(specs: Record<string, any>) {
    const directOptions = specs?.options && typeof specs.options === 'object' ? specs.options : null
    const source = directOptions || specs || {}
    const allowedKeys = [
      'size',
      'paper_size',
      'material',
      'paper',
      'color',
      'sides',
      'finish',
      'finishing',
      'width_mm',
      'height_mm',
      'pages',
    ]

    return allowedKeys.reduce((acc, key) => {
      const value = source[key]
      if (value !== undefined && value !== null && typeof value !== 'object') {
        acc[key] = String(value)
      }
      return acc
    }, {} as Record<string, string>)
  }

  private roundMoney(value: number) {
    return Number.isFinite(value) ? Math.round(value) : 0
  }
}
