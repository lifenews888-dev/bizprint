import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Anthropic from '@anthropic-ai/sdk'
import { AGENT_TOOLS, SYSTEM_PROMPT } from './agent-tools'
import { Order } from '../../orders/entities/order.entity'

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name)
  private anthropic: Anthropic

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  /**
   * Main chat endpoint — sends user message to Claude with tools
   */
  async chat(params: {
    message: string
    userId: string
    userRole: string
    conversationHistory?: any[]
  }) {
    const { message, userId, userRole, conversationHistory = [] } = params

    // Build messages array — only keep simple text messages from history
    // (tool_use/tool_result blocks cause errors when replayed)
    const cleanHistory = (conversationHistory || [])
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => {
        if (typeof m.content === 'string') return m
        // For assistant messages with content blocks, extract text only
        if (Array.isArray(m.content)) {
          const text = m.content
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('\n')
          return text ? { role: m.role, content: text } : null
        }
        return m
      })
      .filter(Boolean)
      // Ensure alternating user/assistant pattern
      .reduce((acc: any[], m: any) => {
        if (acc.length === 0) return [m]
        if (acc[acc.length - 1].role !== m.role) return [...acc, m]
        return acc // Skip duplicate roles
      }, [])

    const messages: any[] = [
      ...cleanHistory,
      { role: 'user', content: message },
    ]

    // Add user context to system prompt
    const systemPrompt = `${SYSTEM_PROMPT}\n\n👤 ОДООГИЙН ХЭРЭГЛЭГЧ:\n- ID: ${userId}\n- Role: ${userRole}\n- Хандалт: ${this.getRoleAccess(userRole)}`

    // Call Claude with tools
    let response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      tools: AGENT_TOOLS as any,
      messages,
    })

    // Process tool calls in a loop
    const toolResults: any[] = []
    while (response.stop_reason === 'tool_use') {
      const toolBlocks = (response.content as any[]).filter(b => b.type === 'tool_use')

      const toolResultMessages: any[] = []
      for (const toolCall of toolBlocks as any[]) {
        this.logger.log(`Tool call: ${toolCall.name}(${JSON.stringify(toolCall.input)})`)

        const result = await this.executeTool(toolCall.name, toolCall.input, userId, userRole)
        toolResults.push({ tool: toolCall.name, input: toolCall.input, result })

        toolResultMessages.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result),
        })
      }

      // Continue conversation with tool results
      messages.push({ role: 'assistant', content: response.content as any })
      messages.push({ role: 'user', content: toolResultMessages })

      response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        tools: AGENT_TOOLS as any,
        messages,
      })
    }

    // Extract final text response
    const textBlocks = (response.content as any[]).filter(b => b.type === 'text')
    const reply = textBlocks.map(b => b.text).join('\n')

    return {
      reply,
      toolsUsed: toolResults.map(t => t.tool),
      // Return only simple text messages for history (no tool blocks)
      conversationHistory: [
        ...cleanHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ].slice(-20),
    }
  }

  /**
   * Execute a tool call and return result
   */
  private async executeTool(name: string, input: any, userId: string, userRole: string): Promise<any> {
    switch (name) {
      case 'calculate_offset_price':
        return this.toolCalculatePrice(input)

      case 'get_product_list':
        return this.toolGetProducts(input)

      case 'check_production_queue':
        return this.toolCheckQueue()

      case 'get_order_status':
        return this.toolGetOrderStatus(input, userId, userRole)

      case 'update_order_status':
        return this.toolUpdateOrderStatus(input, userRole)

      case 'create_quotation':
        return this.toolCreateQuotation(input)

      case 'send_notification':
        return this.toolSendNotification(input, userRole)

      case 'optimize_sheet_layout':
        return this.toolOptimizeSheet(input)

      default:
        return { error: `Unknown tool: ${name}` }
    }
  }

  // ─── Tool Implementations ──────────────────────────────────────

  private async toolCalculatePrice(input: any) {
    const {
      quantity = 500, totalPages = 64, paperSize = 'A3',
      paperGsm = 80, colorMode = 'color', bindingType = '',
      hasCover = false,
    } = input

    // Pricing constants (same as frontend engine)
    const platePrice = 3500
    const platesPerSig = colorMode === 'color' ? 8 : 2
    const pagesPerSig: Record<string, number> = { A3: 2, A4: 4, B5: 8, A5: 8 }
    const paperPrices: Record<number, number> = { 80: 60, 100: 80, 120: 100, 150: 130, 200: 200, 250: 280, 300: 350 }
    const pressFees = colorMode === 'color'
      ? [{ min: 300, max: 500, price: 35000 }, { min: 501, max: 1000, price: 30000 }, { min: 1001, max: 2000, price: 25000 }, { min: 2001, max: 999999, price: 20000 }]
      : [{ min: 300, max: 500, price: 20000 }, { min: 501, max: 1000, price: 17000 }, { min: 1001, max: 2000, price: 14000 }, { min: 2001, max: 999999, price: 11000 }]
    const bindingPrices: Record<string, number> = { 'Зөөлөн хавтас': 1200, 'Хатуу хавтас': 8500, 'Спираль': 2500 }
    const marginPercent = 0.25

    const ppSig = pagesPerSig[paperSize] || 4
    const signatures = Math.ceil(totalPages / ppSig)
    const isDigital = quantity < 300

    if (isDigital) {
      const pricePerPage = colorMode === 'color' ? 120 : 40
      const printCost = totalPages * pricePerPage * quantity
      const paperCost = Math.ceil(quantity * totalPages / ppSig) * (paperPrices[paperGsm] || 60)
      const bindCost = bindingType ? (bindingPrices[bindingType] || 0) * quantity : 0
      const subtotal = printCost + paperCost + bindCost
      const total = Math.round(subtotal * (1 + marginPercent))
      return {
        method: 'digital', quantity, totalPages, paperSize, colorMode,
        subtotal, margin: `${marginPercent * 100}%`, total,
        unitPrice: Math.round(total / quantity),
        breakdown: { printCost, paperCost, bindCost },
      }
    }

    // Offset
    const plateCost = signatures * platesPerSig * platePrice
    const pressTier = pressFees.find(t => quantity >= t.min && quantity <= t.max) || pressFees[pressFees.length - 1]
    const pressCost = signatures * pressTier.price
    const sheets = Math.ceil(quantity * totalPages / ppSig * 1.05)
    const paperCost = sheets * (paperPrices[paperGsm] || 60)
    const foldCost = sheets * ({ A3: 100, A4: 60, B5: 40, A5: 40 }[paperSize] || 60)
    const bindCost = bindingType ? (bindingPrices[bindingType] || 0) * quantity : 0

    let coverCost = 0
    if (hasCover) {
      const coverPlates = platesPerSig * platePrice
      const coverPress = pressTier.price
      const coverPaper = Math.ceil(quantity * 1.05) * (paperPrices[250] || 280)
      coverCost = coverPlates + coverPress + coverPaper
    }

    const subtotal = plateCost + pressCost + paperCost + foldCost + bindCost + coverCost
    const total = Math.round(subtotal * (1 + marginPercent))

    return {
      method: 'offset', quantity, totalPages, paperSize, colorMode, signatures,
      subtotal, margin: `${marginPercent * 100}%`, total,
      unitPrice: Math.round(total / quantity),
      breakdown: { plateCost, pressCost, paperCost, foldCost, bindCost, coverCost },
      estimatedDays: quantity <= 500 ? 3 : quantity <= 1000 ? 5 : 7,
    }
  }

  private async toolGetProducts(input: any) {
    // Use HTTP fetch to internal API (simplest approach)
    try {
      const params = new URLSearchParams()
      if (input.search) params.set('search', input.search)
      if (input.product_type) params.set('product_type', input.product_type)
      params.set('limit', String(input.limit || 10))

      const url = `http://localhost:${process.env.PORT || 4000}/products?${params}`
      const res = await fetch(url).then(r => r.json())
      const items = Array.isArray(res) ? res : res.items || []
      return {
        count: items.length,
        products: items.slice(0, input.limit || 10).map((p: any) => ({
          id: p.id, name: p.name_mn || p.name, category: p.category,
          price: p.base_price, thumbnail: p.thumbnail_url,
        })),
      }
    } catch (e) {
      return { error: 'Бүтээгдэхүүн ачааллахад алдаа', products: [] }
    }
  }

  private async toolCheckQueue() {
    try {
      const inProduction = await this.orderRepo.count({ where: { status: 'IN_PRODUCTION' as any } })
      const finishing = await this.orderRepo.count({ where: { status: 'FINISHING' as any } })
      const pending = await this.orderRepo.count({ where: { status: 'CONFIRMED' as any } })
      const fileReview = await this.orderRepo.count({ where: { status: 'FILE_REVIEW' as any } })

      const totalActive = inProduction + finishing + pending + fileReview
      const estimatedFreeSlot = totalActive <= 3 ? 'Өнөөдөр' : totalActive <= 6 ? 'Маргааш' : `${Math.ceil(totalActive / 3)} өдрийн дараа`

      return {
        inProduction, finishing, pendingConfirmed: pending, fileReview,
        totalActive, estimatedFreeSlot,
        status: totalActive <= 3 ? 'Сул' : totalActive <= 8 ? 'Дунд' : 'Завгүй',
      }
    } catch {
      return { inProduction: 0, finishing: 0, pendingConfirmed: 0, fileReview: 0, totalActive: 0, status: 'Unknown' }
    }
  }

  private async toolGetOrderStatus(input: any, userId: string, userRole: string) {
    try {
      if (input.orderId) {
        const order = await this.orderRepo.findOne({
          where: { id: input.orderId },
          relations: ['items'],
        })
        if (!order) return { error: 'Захиалга олдсонгүй' }
        // Customers can only see their own orders
        if (userRole === 'customer' && order.customer_id !== userId) {
          return { error: 'Энэ захиалгыг харах эрхгүй' }
        }
        return {
          id: order.id, status: order.status, total: order.total_price,
          items: order.items?.length || 0, createdAt: order.created_at,
        }
      }
      // Get user's orders
      const targetUserId = input.userId || userId
      if (userRole === 'customer' && targetUserId !== userId) {
        return { error: 'Бусдын захиалгыг харах эрхгүй' }
      }
      const orders = await this.orderRepo.find({
        where: { customer_id: targetUserId },
        order: { created_at: 'DESC' },
        take: 10,
      })
      return {
        count: orders.length,
        orders: orders.map(o => ({ id: o.id, status: o.status, total: o.total_price, date: o.created_at })),
      }
    } catch (e) {
      return { error: 'Захиалга хайхад алдаа' }
    }
  }

  private async toolUpdateOrderStatus(input: any, userRole: string) {
    // Only admin/factory can update orders
    if (!['admin', 'superadmin', 'factory'].includes(userRole)) {
      return { error: 'Захиалгын төлөв өөрчлөх эрхгүй. Зөвхөн admin/factory хийж чадна.' }
    }
    try {
      const order = await this.orderRepo.findOne({ where: { id: input.orderId } })
      if (!order) return { error: 'Захиалга олдсонгүй' }

      const prevStatus = order.status
      order.status = input.nextStatus
      await this.orderRepo.save(order)

      return {
        success: true,
        orderId: input.orderId,
        previousStatus: prevStatus,
        newStatus: input.nextStatus,
        reason: input.reason || '',
      }
    } catch (e) {
      return { error: 'Төлөв шилжүүлэхэд алдаа' }
    }
  }

  private async toolCreateQuotation(input: any) {
    return {
      message: 'Үнийн санал үүсгэх бэлэн — хэрэглэгч баталгаажуулсны дараа захиалга болно.',
      userId: input.userId,
      productId: input.productId,
      quantity: input.quantity,
      note: 'Cart → Quote → Confirm flow ашиглана.',
    }
  }

  private async toolSendNotification(input: any, userRole: string) {
    if (!['admin', 'superadmin'].includes(userRole)) {
      return { error: 'Мэдэгдэл илгээх эрхгүй' }
    }
    // In production, this would emit Socket.IO event
    return {
      success: true,
      sent_to: input.userId,
      title: input.title,
      message: input.message,
      note: 'Socket.IO мэдэгдэл илгээгдлээ',
    }
  }

  private toolOptimizeSheet(input: any) {
    const { sheetWidth, sheetHeight, itemWidth, itemHeight, quantity } = input

    // Try both orientations
    const normal = Math.floor(sheetWidth / itemWidth) * Math.floor(sheetHeight / itemHeight)
    const rotated = Math.floor(sheetWidth / itemHeight) * Math.floor(sheetHeight / itemWidth)
    const perSheet = Math.max(normal, rotated)
    const sheetsNeeded = Math.ceil(quantity / perSheet)
    const totalProduced = sheetsNeeded * perSheet
    const waste = totalProduced - quantity
    const wastePercent = ((waste / totalProduced) * 100).toFixed(1)

    return {
      perSheet,
      sheetsNeeded,
      totalProduced,
      waste,
      wastePercent: `${wastePercent}%`,
      orientation: rotated > normal ? 'Эргүүлсэн (rotated)' : 'Хэвийн',
      sheetSize: `${sheetWidth}×${sheetHeight}мм`,
      itemSize: `${itemWidth}×${itemHeight}мм`,
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private getRoleAccess(role: string): string {
    const access: Record<string, string> = {
      admin: 'Бүх tool ашиглах боломжтой',
      superadmin: 'Бүх tool ашиглах боломжтой',
      factory: 'Үйлдвэрлэлийн tool + захиалга удирдах',
      vendor: 'Өөрийн бүтээгдэхүүн, захиалга харах',
      customer: 'Үнэ бодох, бүтээгдэхүүн хайх, өөрийн захиалга харах',
      designer: 'Файл шалгах, дизайн хүсэлт',
      courier: 'Хүргэлтийн мэдээлэл',
      sales: 'Үнэ бодох, захиалга үүсгэх',
    }
    return access[role] || 'Зөвхөн унших'
  }
}
