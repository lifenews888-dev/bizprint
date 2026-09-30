import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, IsNull, Repository } from 'typeorm'
import { createHash, randomBytes, randomUUID } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { ColorCode } from './entities/color-code.entity'
import { PrintDevice } from './entities/print-device.entity'
import { DeviceColorProfile } from './entities/device-color-profile.entity'
import { PrintAgent } from './entities/print-agent.entity'
import { PrintTicket, PrintTicketStatus } from './entities/print-ticket.entity'
import { PrintProductType } from './entities/print-product-type.entity'
import { Order, OrderStatus } from '../orders/entities/order.entity'
import { OrderItem } from '../orders/entities/order-item.entity'
import { deltaE2000, hexToLab, labToHex, Lab } from './color-math'
import { DeviceState, RouteRequest, routeJob, evaluateDevice, profileFor } from './routing'
import { buildJdf, TicketColor } from './jdf'
import {
  AgentPollDto, AgentTicketStatusDto, CheckColorsDto, ColorCodeDto, CreateAgentDto, DispatchItemDto,
  DispatchOrderDto, PrintDeviceDto, PrintProductTypeDto, RoutePreviewDto, UpdateColorCodeDto, UpdatePrintDeviceDto, UpsertProfilesDto,
} from './dto'

/** Агент энэ хугацаанд heartbeat илгээгээгүй бол офлайн гэж үзнэ */
const AGENT_ONLINE_MS = 2 * 60 * 1000
/** claimed төлөвт ийм удаан гацсан тасалбарыг дахин дараалалд оруулна */
const STALE_CLAIM_MINUTES = 30

const OPEN_STATUSES = [
  PrintTicketStatus.QUEUED, PrintTicketStatus.CLAIMED, PrintTicketStatus.IN_HOTFOLDER, PrintTicketStatus.PRINTING,
]

const DISPATCHABLE_ORDER_STATUSES: string[] = [
  OrderStatus.CONFIRMED, OrderStatus.FILE_REVIEW, OrderStatus.IN_PRODUCTION, OrderStatus.FINISHING,
]

/** Агентын зөвшөөрөгдөх төлөв шилжилт */
const AGENT_TRANSITIONS: Record<string, string[]> = {
  [PrintTicketStatus.CLAIMED]: [PrintTicketStatus.IN_HOTFOLDER, PrintTicketStatus.PRINTING, PrintTicketStatus.FAILED],
  [PrintTicketStatus.IN_HOTFOLDER]: [PrintTicketStatus.PRINTING, PrintTicketStatus.PRINTED, PrintTicketStatus.FAILED],
  [PrintTicketStatus.PRINTING]: [PrintTicketStatus.PRINTED, PrintTicketStatus.FAILED],
}

export const hashAgentToken = (token: string) => createHash('sha256').update(token).digest('hex')

const labOf = (c: ColorCode): Lab => ({ l: c.labL, a: c.labA, b: c.labB })

@Injectable()
export class PrintNetworkService {
  constructor(
    @InjectRepository(ColorCode) private colors: Repository<ColorCode>,
    @InjectRepository(PrintDevice) private devices: Repository<PrintDevice>,
    @InjectRepository(DeviceColorProfile) private profiles: Repository<DeviceColorProfile>,
    @InjectRepository(PrintAgent) private agents: Repository<PrintAgent>,
    @InjectRepository(PrintTicket) private tickets: Repository<PrintTicket>,
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(OrderItem) private orderItems: Repository<OrderItem>,
    @InjectRepository(PrintProductType) private productTypes: Repository<PrintProductType>,
    @InjectDataSource() private ds: DataSource,
  ) {}

  // ─── Хэвлэлийн бүтээгдэхүүний төрөл ────────────────────────────

  /** Захиалагчид: идэвхтэй төрлүүд + одоогоор хэвлэх принтер байгаа эсэх */
  async listProductTypes(includeInactive = false) {
    const list = await this.productTypes.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    })
    const states = await this.loadDeviceStates()
    return list.map((t) => ({
      ...t,
      orderable: !!t.productId && states.some((d) => d.status === 'active' && d.productTypes.includes(t.key)),
    }))
  }

  async upsertProductType(dto: PrintProductTypeDto) {
    const existing = await this.productTypes.findOne({ where: { key: dto.key } })
    return this.productTypes.save(Object.assign(existing ?? this.productTypes.create(), dto))
  }

  // ─── Өнгөний каталог ────────────────────────────────────────────

  private normalizeColor(dto: ColorCodeDto | UpdateColorCodeDto, existing?: ColorCode): Partial<ColorCode> {
    const hasLab = dto.labL !== undefined && dto.labA !== undefined && dto.labB !== undefined
    const partialLab = [dto.labL, dto.labA, dto.labB].some((v) => v !== undefined)
    if (partialLab && !hasLab) throw new BadRequestException('labL, labA, labB гурвууланг нь өгнө үү')

    const out: Partial<ColorCode> = {}
    if ('code' in dto && dto.code) out.code = dto.code.toUpperCase()
    if (dto.name !== undefined) out.name = dto.name
    if (dto.family !== undefined) out.family = dto.family
    if (dto.sortOrder !== undefined) out.sortOrder = dto.sortOrder
    if (dto.isActive !== undefined) out.isActive = dto.isActive

    if (hasLab) {
      Object.assign(out, { labL: dto.labL, labA: dto.labA, labB: dto.labB })
      out.hex = dto.hex?.toUpperCase() ?? labToHex({ l: dto.labL!, a: dto.labA!, b: dto.labB! })
    } else if (dto.hex) {
      const lab = hexToLab(dto.hex)
      out.hex = dto.hex.toUpperCase()
      // Lab-ийг шинэ өнгө эсвэл өмнө нь байгаагүй үед л hex-ээс тооцоолно
      if (!existing) Object.assign(out, { labL: lab.l, labA: lab.a, labB: lab.b })
    } else if (!existing) {
      throw new BadRequestException('Lab (labL/labA/labB) эсвэл hex өгнө үү')
    }
    return out
  }

  async listColors(opts: { family?: string; productType?: string; includeInactive?: boolean }) {
    const qb = this.colors.createQueryBuilder('c').orderBy('c.sort_order').addOrderBy('c.code')
    if (!opts.includeInactive) qb.andWhere('c.is_active = true')
    if (opts.family) qb.andWhere('c.family = :family', { family: opts.family })
    const list = await qb.getMany()
    if (!opts.productType) return list

    const states = await this.loadDeviceStates()
    return list.map((c) => {
      const devices = this.devicesForColor(states, c.code, opts.productType!)
      return { ...c, available: devices.length > 0, deviceCount: devices.length }
    })
  }

  async createColor(dto: ColorCodeDto) {
    const data = this.normalizeColor(dto)
    if (await this.colors.findOne({ where: { code: data.code } })) {
      throw new ConflictException(`${data.code} код бүртгэлтэй байна`)
    }
    return this.colors.save(this.colors.create(data))
  }

  async bulkUpsertColors(list: ColorCodeDto[]) {
    let created = 0
    let updated = 0
    for (const dto of list) {
      const code = dto.code.toUpperCase()
      const existing = await this.colors.findOne({ where: { code } })
      if (existing) {
        const before = [existing.labL, existing.labA, existing.labB].join()
        Object.assign(existing, this.normalizeColor(dto, existing))
        const saved = await this.colors.save(existing)
        if ([saved.labL, saved.labA, saved.labB].join() !== before) await this.recomputeDeltaE(saved)
        updated++
      } else {
        await this.colors.save(this.colors.create(this.normalizeColor(dto)))
        created++
      }
    }
    return { created, updated }
  }

  async updateColor(id: string, dto: UpdateColorCodeDto) {
    const c = await this.colors.findOne({ where: { id } })
    if (!c) throw new NotFoundException('Өнгө олдсонгүй')
    const labChanged = dto.labL !== undefined
    Object.assign(c, this.normalizeColor(dto, c))
    const saved = await this.colors.save(c)
    // Эталон Lab өөрчлөгдвөл бүх хэмжилтийн ΔE-г дахин тооцоолно
    if (labChanged) await this.recomputeDeltaE(saved)
    return saved
  }

  private async recomputeDeltaE(color: ColorCode) {
    const rows = await this.profiles.find({ where: { colorCodeId: color.id } })
    for (const p of rows) {
      p.deltaE = round2(deltaE2000(labOf(color), { l: p.measuredL, a: p.measuredA, b: p.measuredB }))
    }
    if (rows.length) await this.profiles.save(rows)
  }

  /** Хэрэглэгч сонгосон өнгөнүүд тухайн бүтээгдэхүүн дээр хэвлэгдэх боломжтой эсэх */
  async checkColors(dto: CheckColorsDto) {
    const codes = [...new Set(dto.codes.map((c) => c.toUpperCase()))]
    const catalog = await this.colors.find({ where: { isActive: true } })
    const byCode = new Map(catalog.map((c) => [c.code, c]))
    const states = await this.loadDeviceStates()

    const availableCodes = catalog.filter((c) => this.devicesForColor(states, c.code, dto.productType, dto.media).length)

    const results = codes.map((code) => {
      const color = byCode.get(code)
      if (!color) return { code, known: false, available: false, devices: [], suggestions: [] }
      const devices = this.devicesForColor(states, code, dto.productType, dto.media)
      const suggestions = devices.length
        ? []
        : availableCodes
            .filter((c) => c.code !== code)
            .map((c) => ({ code: c.code, name: c.name, hex: c.hex, deltaE: round2(deltaE2000(labOf(color), labOf(c))) }))
            .sort((a, b) => a.deltaE - b.deltaE)
            .slice(0, 3)
      // Нийтийн endpoint — принтерийн id/нэрийг задруулахгүй
      const pub = devices.map((d) => ({ technology: d.technology, deltaE: d.deltaE }))
      return { code, known: true, name: color.name, hex: color.hex, available: devices.length > 0, devices: pub, suggestions }
    })

    return { productType: dto.productType, allAvailable: results.every((r) => r.available), results }
  }

  private devicesForColor(states: DeviceState[], code: string, productType: string, media?: string | null) {
    return states
      .filter((d) => d.status === 'active' && d.productTypes.includes(productType))
      .filter((d) => !media || !d.media.length || d.media.includes(media))
      .map((d) => ({ d, p: profileFor(d.profiles.get(code), media) }))
      .filter(({ d, p }) => p && p.deltaE <= d.deltaETolerance)
      .map(({ d, p }) => ({ id: d.id, name: d.name, technology: d.technology, deltaE: p!.deltaE }))
  }

  // ─── Принтер ба калибровк ───────────────────────────────────────

  async listDevices() {
    const states = await this.loadDeviceStates()
    const all = await this.devices.find({ order: { name: 'ASC' } })
    const stateById = new Map(states.map((s) => [s.id, s]))
    return all.map((d) => {
      const s = stateById.get(d.id)!
      return { ...d, online: s.online, queueLength: s.queueLength, calibratedColors: s.profiles.size }
    })
  }

  async createDevice(dto: PrintDeviceDto) {
    if (dto.agentId) await this.requireAgent(dto.agentId)
    return this.devices.save(this.devices.create({ ...dto, media: dto.media ?? [] }))
  }

  async updateDevice(id: string, dto: UpdatePrintDeviceDto) {
    const d = await this.devices.findOne({ where: { id } })
    if (!d) throw new NotFoundException('Принтер олдсонгүй')
    if (dto.agentId) await this.requireAgent(dto.agentId)
    const clean = Object.fromEntries(Object.entries(dto).filter(([k, v]) => v !== null || ['agentId', 'maxWidthMm', 'hotfolderKey', 'notes'].includes(k)))
    Object.assign(d, clean)
    return this.devices.save(d)
  }

  async getProfiles(deviceId: string) {
    const device = await this.devices.findOne({ where: { id: deviceId } })
    if (!device) throw new NotFoundException('Принтер олдсонгүй')
    const rows = await this.profiles.find({ where: { deviceId } })
    const colors = await this.colors.findBy({ id: In(rows.map((r) => r.colorCodeId)) })
    const byId = new Map(colors.map((c) => [c.id, c]))
    return rows
      .map((r) => {
        const c = byId.get(r.colorCodeId)
        return { ...r, code: c?.code, name: c?.name, hex: c?.hex, pass: r.deltaE <= device.deltaETolerance }
      })
      .sort((a, b) => String(a.code).localeCompare(String(b.code)))
  }

  /** Спектрофотометрийн хэмжилтийг хадгалж ΔE00-г тооцоолно */
  async upsertProfiles(deviceId: string, dto: UpsertProfilesDto) {
    const device = await this.devices.findOne({ where: { id: deviceId } })
    if (!device) throw new NotFoundException('Принтер олдсонгүй')

    const codes = [...new Set(dto.measurements.map((m) => m.code.toUpperCase()))]
    const colors = await this.colors.findBy({ code: In(codes) })
    const byCode = new Map(colors.map((c) => [c.code, c]))
    const unknown = codes.filter((c) => !byCode.has(c))
    if (unknown.length) throw new BadRequestException(`Каталогт байхгүй код: ${unknown.join(', ')}`)

    const results: { code: string; media: string; deltaE: number; pass: boolean }[] = []
    for (const m of dto.measurements) {
      const color = byCode.get(m.code.toUpperCase())!
      const media = m.media ?? ''
      const deltaE = round2(deltaE2000(labOf(color), { l: m.l, a: m.a, b: m.b }))
      await this.profiles.upsert(
        {
          deviceId, colorCodeId: color.id, media,
          measuredL: m.l, measuredA: m.a, measuredB: m.b, deltaE,
          recipe: m.recipe ?? null, measuredAt: new Date(),
        },
        ['deviceId', 'colorCodeId', 'media'],
      )
      results.push({ code: color.code, media, deltaE, pass: deltaE <= device.deltaETolerance })
    }
    return { device: device.name, tolerance: device.deltaETolerance, passed: results.filter((r) => r.pass).length, results }
  }

  async deleteProfile(deviceId: string, code: string, media = '') {
    const color = await this.colors.findOne({ where: { code: code.toUpperCase() } })
    if (!color) throw new NotFoundException('Өнгө олдсонгүй')
    const r = await this.profiles.delete({ deviceId, colorCodeId: color.id, media })
    return { deleted: r.affected ?? 0 }
  }

  /** Админ: desktop/вэбээс өгсөн хэвлэлийн (productType-тэй) захиалгууд + тасалбарын төлөв */
  async listPrintOrders(limit?: number) {
    // order_items.order_id нь varchar, orders.id нь uuid тул ::text-ээр харьцуулна
    return this.ds.query(
      `SELECT o.id, o.invoice_no, o.status, o.total_price, o.created_at, o.customer_name, o.customer_email,
              json_agg(json_build_object('id', i.id, 'quantity', i.quantity, 'specs', i.specs) ORDER BY i.created_at) AS items,
              (SELECT coalesce(json_agg(json_build_object('id', t.id, 'status', t.status, 'deviceId', t.device_id,
                                                          'error', t.error, 'createdAt', t.created_at) ORDER BY t.created_at), '[]')
                 FROM print_tickets t WHERE t.order_id = o.id) AS tickets
         FROM orders o
         JOIN order_items i ON i.order_id = o.id::text
        WHERE i.specs ? 'productType' OR i.specs ? 'product_type'
           OR i.product_id IN (SELECT product_id::text FROM print_product_types WHERE product_id IS NOT NULL)
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT $1`,
      [clampLimit(limit, 100)],
    )
  }

  // ─── Агент ─────────────────────────────────────────────────────

  async createAgent(dto: CreateAgentDto) {
    const token = 'bpa_' + randomBytes(24).toString('base64url')
    const agent = await this.agents.save(
      this.agents.create({ name: dto.name, vendorId: dto.vendorId ?? null, tokenHash: hashAgentToken(token) }),
    )
    const { tokenHash: _omit, ...safe } = agent
    // Токеныг зөвхөн нэг удаа буцаана
    return { agent: safe, token }
  }

  async listAgents() {
    const list = await this.agents.find({ order: { createdAt: 'DESC' } })
    const now = Date.now()
    return list.map((a) => ({ ...a, online: !!a.lastSeenAt && now - a.lastSeenAt.getTime() < AGENT_ONLINE_MS }))
  }

  async rotateAgentToken(id: string) {
    await this.requireAgent(id)
    const token = 'bpa_' + randomBytes(24).toString('base64url')
    await this.agents.update(id, { tokenHash: hashAgentToken(token) })
    return { token }
  }

  async authenticateAgent(token: string): Promise<PrintAgent | null> {
    if (!token) return null
    const agent = await this.agents.findOne({ where: { tokenHash: hashAgentToken(token), isActive: true } })
    return agent ?? null
  }

  async touchAgent(agent: PrintAgent, info: { version?: string; hostname?: string }) {
    await this.agents.update(agent.id, {
      lastSeenAt: new Date(),
      ...(info.version ? { version: info.version } : {}),
      ...(info.hostname ? { hostname: info.hostname } : {}),
    })
  }

  private async requireAgent(id: string) {
    const a = await this.agents.findOne({ where: { id } })
    if (!a) throw new NotFoundException('Агент олдсонгүй')
    return a
  }

  // ─── Чиглүүлэлт ────────────────────────────────────────────────

  async loadDeviceStates(): Promise<DeviceState[]> {
    const [devices, agents, profileRows, queue] = await Promise.all([
      this.devices.find(),
      this.agents.find(),
      this.ds.query(
        `SELECT p.device_id, c.code, p.media, p.delta_e
           FROM device_color_profiles p JOIN color_codes c ON c.id = p.color_code_id
          WHERE c.is_active = true`,
      ) as Promise<{ device_id: string; code: string; media: string; delta_e: string }[]>,
      this.ds.query(
        `SELECT device_id, count(*)::int AS n FROM print_tickets WHERE status = ANY($1) GROUP BY device_id`,
        [OPEN_STATUSES],
      ) as Promise<{ device_id: string; n: number }[]>,
    ])

    const now = Date.now()
    const agentOnline = new Map(agents.map((a) => [a.id, a.isActive && !!a.lastSeenAt && now - a.lastSeenAt.getTime() < AGENT_ONLINE_MS]))
    const queueBy = new Map(queue.map((q) => [q.device_id, q.n]))
    const profilesBy = new Map<string, Map<string, { media: string; deltaE: number }[]>>()
    for (const r of profileRows) {
      let m = profilesBy.get(r.device_id)
      if (!m) profilesBy.set(r.device_id, (m = new Map()))
      const list = m.get(r.code) ?? []
      list.push({ media: r.media, deltaE: Number(r.delta_e) })
      m.set(r.code, list)
    }

    return devices.map((d) => ({
      id: d.id,
      name: d.name,
      technology: d.technology,
      status: d.status,
      productTypes: d.productTypes ?? [],
      media: d.media ?? [],
      maxWidthMm: d.maxWidthMm,
      deltaETolerance: d.deltaETolerance,
      // Агентгүй принтер = гараар hotfolder-т хуулдаг (MVP) → онлайн гэж тооцно
      online: d.agentId ? !!agentOnline.get(d.agentId) : true,
      queueLength: queueBy.get(d.id) ?? 0,
      profiles: profilesBy.get(d.id) ?? new Map(),
    }))
  }

  async previewRoute(dto: RoutePreviewDto) {
    const req: RouteRequest = { ...dto, colorCodes: dto.colorCodes.map((c) => c.toUpperCase()) }
    return routeJob(await this.loadDeviceStates(), req)
  }

  /**
   * Захиалгын мөр бүрийг тохирох принтерт чиглүүлж тасалбар үүсгэнэ.
   * Order-ын state machine-д хүрэхгүй (FROZEN) — зөвхөн print_tickets бичнэ.
   */
  async dispatchOrder(orderId: string, dto: DispatchOrderDto) {
    const order = await this.orders.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Захиалга олдсонгүй')
    if (!DISPATCHABLE_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException(`"${order.status}" төлөвтэй захиалгыг хэвлэлд илгээх боломжгүй`)
    }

    const items = await this.orderItems.find({ where: { order_id: orderId } })
    const overrides = new Map((dto.items ?? []).filter((i) => i.orderItemId).map((i) => [i.orderItemId!, i]))
    for (const id of overrides.keys()) {
      if (!items.some((it) => it.id === id)) throw new BadRequestException(`Мөр ${id} энэ захиалгад хамаарахгүй`)
    }

    // Мөргүй захиалга → order-ын түвшний нэг ажил
    const jobs: { item: OrderItem | null; o: DispatchItemDto }[] = items.length
      ? items.map((item) => ({ item, o: overrides.get(item.id) ?? {} }))
      : [{ item: null, o: dto.items?.[0] ?? {} }]

    const colorCatalog = await this.colors.find({ where: { isActive: true } })
    const colorBy = new Map(colorCatalog.map((c) => [c.code, c]))
    // Хэвлэлийн төрлийг захиалагчийн specs-ээс биш, ТӨЛСӨН бүтээгдэхүүнээс нь тодорхойлно
    const typeByProduct = new Map(
      (await this.productTypes.find({ where: { isActive: true } }))
        .filter((t) => t.productId)
        .map((t) => [String(t.productId), t.key]),
    )
    const states = await this.loadDeviceStates()
    const devicesById = new Map((await this.devices.find()).map((d) => [d.id, d]))
    const orderNumber = (order as any).order_number ?? order.invoice_no ?? null

    const created: PrintTicket[] = []
    const skipped: { orderItemId: string | null; reason: string; rejected?: any[] }[] = []
    let nonPrintItems = 0

    for (const { item, o } of jobs) {
      const specs: Record<string, any> = item?.specs && typeof item.specs === 'object' ? item.specs : {}
      const itemId = item?.id ?? null

      const mappedType = item?.product_id ? typeByProduct.get(String(item.product_id)) : undefined
      const claimedType = str(specs.productType ?? specs.product_type ?? specs.print_type)
      // Админ гараар заасан төрөл > бүтээгдэхүүний холбоос. Хэвлэлийн бус мөрийг (өөр бараа) чимээгүй алгасна.
      const productType = o.productType ?? mappedType
      if (!productType) {
        if (claimedType) skipped.push({ orderItemId: itemId, reason: 'Бүтээгдэхүүн хэвлэлийн төрөлтэй холбогдоогүй (Админ → 1-р алхам)' })
        else nonPrintItems++
        continue
      }

      const existing = await this.tickets.find({ where: itemId ? { orderItemId: itemId } : { orderId, orderItemId: IsNull() } })
      if (existing.some((t) => OPEN_STATUSES.includes(t.status as PrintTicketStatus))) {
        skipped.push({ orderItemId: itemId, reason: 'Хэвлэлт явагдаж байна (идэвхтэй тасалбар бий)' })
        continue
      }
      if (!dto.reprint && existing.some((t) => t.status === PrintTicketStatus.PRINTED)) {
        skipped.push({ orderItemId: itemId, reason: 'Аль хэдийн хэвлэгдсэн — дахин хэвлэх бол "reprint" сонгоно' })
        continue
      }

      const req: RouteRequest = {
        productType,
        colorCodes: strList(o.colorCodes ?? specs.colorCodes ?? specs.color_codes).map((c) => c.toUpperCase()),
        widthMm: o.widthMm ?? num(specs.width_mm ?? specs.widthMm) ?? num(order.width_mm),
        heightMm: o.heightMm ?? num(specs.height_mm ?? specs.heightMm) ?? num(order.height_mm),
        media: o.media ?? str(specs.media),
      }
      const rawFileUrl = o.fileUrl ?? str(specs.file_url ?? specs.fileUrl) ?? order.file_url
      const quantity = o.quantity ?? item?.quantity ?? order.quantity ?? 1

      if (!rawFileUrl) { skipped.push({ orderItemId: itemId, reason: 'Хэвлэх файл байхгүй' }); continue }
      // Цехийн агент зөвхөн манай серверт upload хийгдсэн файлыг татна (SSRF, аюултай өргөтгөлөөс хамгаална)
      const fileUrl = safeUploadedFileUrl(rawFileUrl)
      if (!fileUrl) { skipped.push({ orderItemId: itemId, reason: 'Хэвлэх файл буруу эсвэл серверт олдсонгүй' }); continue }
      const unknown = req.colorCodes.filter((c) => !colorBy.has(c))
      if (unknown.length) { skipped.push({ orderItemId: itemId, reason: `Каталогт байхгүй өнгө: ${unknown.join(', ')}` }); continue }

      let chosenId: string | null
      if (o.deviceId) {
        const st = states.find((s) => s.id === o.deviceId)
        if (!st) { skipped.push({ orderItemId: itemId, reason: 'Сонгосон принтер олдсонгүй' }); continue }
        const r = evaluateDevice(st, req)
        if ('reasons' in r) { skipped.push({ orderItemId: itemId, reason: 'Сонгосон принтер тохирохгүй', rejected: [r] }); continue }
        chosenId = r.deviceId
      } else {
        const r = routeJob(states, req)
        if (!r.chosen) { skipped.push({ orderItemId: itemId, reason: 'Тохирох принтер алга', rejected: r.rejected }); continue }
        chosenId = r.chosen.deviceId
      }

      const device = devicesById.get(chosenId)!
      const st = states.find((s) => s.id === chosenId)!
      const ticketColors: TicketColor[] = req.colorCodes.map((code) => {
        const c = colorBy.get(code)!
        return { code, name: c.name, lab: labOf(c) }
      })
      await this.attachRecipes(device.id, ticketColors, req.media)

      // Бүрэн бэлэн тасалбарыг НЭГ удаа insert хийнэ — агент хагас бичигдсэн мөр авах боломжгүй
      const ticketId = randomUUID()
      const fileName = ticketFileName(orderNumber ?? orderId.slice(0, 8), ticketId, fileUrl)
      const data = {
        ticketId, orderId, orderNumber, productType: req.productType, quantity,
        widthMm: req.widthMm, heightMm: req.heightMm, media: req.media, fileUrl, fileName,
        colors: ticketColors,
        device: { id: device.id, name: device.name, technology: device.technology },
        hotfolderKey: device.hotfolderKey,
        notes: o.notes ?? str(specs.notes),
      }
      const ticket = this.tickets.create({
        id: ticketId, orderId, orderItemId: itemId, orderNumber, deviceId: device.id, agentId: device.agentId,
        status: PrintTicketStatus.QUEUED, fileUrl, payload: data, jdf: buildJdf(data),
      })
      try {
        await this.tickets.insert(ticket)
      } catch (e: any) {
        // uq_print_tickets_open: зэрэг илгээсэн (давхар дарсан) хүсэлт
        if (e?.code === '23505') { skipped.push({ orderItemId: itemId, reason: 'Хэвлэлт явагдаж байна (идэвхтэй тасалбар бий)' }); continue }
        throw e
      }
      created.push(ticket)
      st.queueLength++ // дараагийн мөрийн чиглүүлэлтэд ачааллыг тусгана
    }

    return { orderId, created: created.map(stripJdf), skipped, nonPrintItems }
  }

  /** RIP-ийн spot сангийн нэр / хольцыг тасалбарт хавсаргана */
  private async attachRecipes(deviceId: string, colors: TicketColor[], media?: string | null) {
    if (!colors.length) return
    const rows: { code: string; media: string; recipe: any }[] = await this.ds.query(
      `SELECT c.code, p.media, p.recipe FROM device_color_profiles p JOIN color_codes c ON c.id = p.color_code_id
        WHERE p.device_id = $1 AND c.code = ANY($2)`,
      [deviceId, colors.map((c) => c.code)],
    )
    for (const c of colors) {
      const match = rows.find((r) => r.code === c.code && media && r.media === media) ?? rows.find((r) => r.code === c.code && r.media === '')
      c.recipe = match?.recipe ?? null
    }
  }

  // ─── Тасалбар ──────────────────────────────────────────────────

  async listTickets(opts: { status?: string; orderId?: string; deviceId?: string; limit?: number }) {
    const where: any = {}
    if (opts.status) where.status = opts.status
    if (opts.orderId) where.orderId = requireUuid(opts.orderId, 'orderId')
    if (opts.deviceId) where.deviceId = requireUuid(opts.deviceId, 'deviceId')
    const list = await this.tickets.find({ where, order: { createdAt: 'DESC' }, take: clampLimit(opts.limit, 100) })
    return list.map(stripJdf)
  }

  async getTicket(id: string) {
    const t = await this.tickets.findOne({ where: { id } })
    if (!t) throw new NotFoundException('Тасалбар олдсонгүй')
    return t
  }

  async requeueTicket(id: string) {
    const t = await this.getTicket(id)
    if (![PrintTicketStatus.FAILED, PrintTicketStatus.CLAIMED, PrintTicketStatus.CANCELLED].includes(t.status as PrintTicketStatus)) {
      throw new BadRequestException(`"${t.status}" төлөвөөс дахин дараалалд оруулах боломжгүй`)
    }
    Object.assign(t, { status: PrintTicketStatus.QUEUED, error: null, claimedAt: null, finishedAt: null })
    try {
      return stripJdf(await this.tickets.save(t))
    } catch (e: any) {
      if (e?.code === '23505') throw new ConflictException('Энэ мөрөнд өөр идэвхтэй тасалбар байна')
      throw e
    }
  }

  async cancelTicket(id: string) {
    const t = await this.getTicket(id)
    if (t.status === PrintTicketStatus.PRINTED) throw new BadRequestException('Хэвлэгдсэн тасалбарыг цуцлах боломжгүй')
    Object.assign(t, { status: PrintTicketStatus.CANCELLED, finishedAt: new Date() })
    return stripJdf(await this.tickets.save(t))
  }

  // ─── Агентын API ───────────────────────────────────────────────

  /** Агентын принтерүүдэд оногдсон ажлуудыг атомаар "claimed" болгон буцаана */
  async agentPoll(agent: PrintAgent, dto: AgentPollDto) {
    await this.touchAgent(agent, dto)
    const devices = await this.devices.find({ where: { agentId: agent.id } })
    if (!devices.length) return { devices: [], tickets: [] }

    const rows: { id: string }[] = await this.ds.query(
      `UPDATE print_tickets t
          SET status = 'claimed', agent_id = $1, claimed_at = now(), attempts = attempts + 1, updated_at = now()
        WHERE t.id IN (
          SELECT id FROM print_tickets
           WHERE device_id = ANY($2)
             AND (status = 'queued' OR (status = 'claimed' AND claimed_at < now() - make_interval(mins => $4::int)))
           ORDER BY created_at
           LIMIT $3
           FOR UPDATE SKIP LOCKED)
      RETURNING t.id`,
      [agent.id, devices.map((d) => d.id), dto.limit ?? 5, STALE_CLAIM_MINUTES],
    )
    // pg UPDATE ... RETURNING нь [rows, count] хэлбэрээр ирж болно
    const ids = (Array.isArray(rows[0]) ? (rows[0] as any) : rows).map((r: { id: string }) => r.id)
    const tickets = ids.length ? await this.tickets.findBy({ id: In(ids) }) : []

    return {
      devices: devices.map((d) => ({ id: d.id, name: d.name, hotfolderKey: d.hotfolderKey, status: d.status })),
      tickets: tickets
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((t) => ({
          id: t.id, deviceId: t.deviceId, fileUrl: t.fileUrl, fileName: t.payload?.fileName,
          hotfolderKey: t.payload?.hotfolderKey, attempts: t.attempts, payload: t.payload, jdf: t.jdf,
        })),
    }
  }

  /**
   * Агентын төлөв мэдэгдэл. Нөхцөлтэй UPDATE тул админы цуцлалтыг дарж бичихгүй.
   * status=claimed (ижил) → keep-alive: том файл татаж байх үед claimed_at-ийг сунгана.
   */
  async agentUpdateTicket(agent: PrintAgent, id: string, dto: AgentTicketStatusDto) {
    await this.touchAgent(agent, {})
    const fromStatuses = dto.status === PrintTicketStatus.CLAIMED
      ? [PrintTicketStatus.CLAIMED]
      : Object.entries(AGENT_TRANSITIONS).filter(([, to]) => to.includes(dto.status)).map(([from]) => from).concat(dto.status)
    const finished = dto.status === PrintTicketStatus.PRINTED || dto.status === PrintTicketStatus.FAILED
    const res = await this.tickets
      .createQueryBuilder()
      .update(PrintTicket)
      .set({
        status: dto.status,
        ...(dto.status === PrintTicketStatus.CLAIMED ? { claimedAt: () => 'now()' } : {}),
        ...(dto.status === PrintTicketStatus.FAILED ? { error: dto.error ?? 'Тодорхойгүй алдаа' } : dto.status !== PrintTicketStatus.CLAIMED ? { error: null } : {}),
        ...(finished ? { finishedAt: () => 'now()' } : {}),
      })
      .where('id = :id AND agent_id = :agent AND status IN (:...from)', { id, agent: agent.id, from: fromStatuses })
      .execute()
    const t = await this.tickets.findOne({ where: { id } })
    if (!t || t.agentId !== agent.id) throw new NotFoundException('Тасалбар олдсонгүй')
    if (!res.affected) {
      if (t.status === PrintTicketStatus.CANCELLED) throw new ConflictException('Тасалбар цуцлагдсан')
      throw new BadRequestException(`${t.status} → ${dto.status} шилжилт зөвшөөрөгдөхгүй`)
    }
    return stripJdf(t)
  }
}

function clampLimit(v: unknown, dflt: number) {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : dflt
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function requireUuid(v: string, name: string) {
  if (!UUID_RE.test(v)) throw new BadRequestException(`${name} буруу байна`)
  return v
}

function round2(v: number) {
  return Math.round(v * 100) / 100
}

/** Захиалагчийн specs-ийн утга string биш бол хаяна */
function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).map((x) => x.trim()) : []
}

const PRINT_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'tif', 'tiff']
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')

/**
 * Зөвхөн манай /uploads/ (эсвэл /uploads/print-files/) дотор upload хийгдсэн,
 * хэвлэлийн өргөтгөлтэй, дискэнд БАЙГАА файлыг зөвшөөрнө. Бусад бүх URL
 * (гадны хост, LAN хаяг, file://, ../) → null.
 */
export function safeUploadedFileUrl(raw: string, root = UPLOADS_ROOT): string | null {
  const m = /^\/uploads\/((?:print-files\/)?[A-Za-z0-9][A-Za-z0-9._-]{0,200})$/.exec(String(raw).trim())
  if (!m || m[1].includes('..')) return null
  const ext = m[1].split('.').pop()!.toLowerCase()
  if (!PRINT_EXTS.includes(ext)) return null
  if (!fs.existsSync(path.join(root, m[1]))) return null
  return `/uploads/${m[1]}`
}

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function stripJdf(t: PrintTicket) {
  const { jdf: _jdf, ...rest } = t
  return rest
}

export function ticketFileName(prefix: string, ticketId: string, fileUrl: string) {
  let ext = '.pdf'
  let pathname = fileUrl
  try { pathname = new URL(fileUrl, 'http://x').pathname } catch { /* буруу зам — .pdf */ }
  const m = /\.([a-z0-9]{2,5})$/i.exec(pathname)
  if (m && PRINT_EXTS.includes(m[1].toLowerCase())) ext = '.' + m[1].toLowerCase()
  const safe = String(prefix).replace(/[^A-Za-z0-9_-]/g, '_')
  return `${safe}_${ticketId.slice(0, 8)}${ext}`
}
