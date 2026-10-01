import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import * as fs from 'fs'
import * as path from 'path'
import { OrdersService } from '../orders/order.service'
import { OrderStatus } from '../orders/entities/order.entity'
import { NotificationService } from '../notifications/notification.service'
import { PdfInspectorService } from '../ai/pdf-inspector/pdf-inspector.service'
import { PrintNetworkService, safeUploadedFileUrl } from './print-network.service'
import { AutomationState, PrintOrderAutomation } from './entities/print-order-automation.entity'
import { PrintTicketStatus } from './entities/print-ticket.entity'

const PREFLIGHT_MAX_BYTES = 100 * 1024 * 1024
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')

/**
 * Хэвлэлийн захиалгыг төлбөрөөс хэвлэл хүртэл гар оролцоогүйгээр явуулна.
 * Order state machine-ийн зөвшөөрөгдсөн шилжилтийг OrdersService.updateStatus-аар
 * (мэдэгдэл, имэйл, realtime-тэй) дамжуулна:
 *
 *   paid: PENDING_FILE → FILE_REVIEW → (preflight) → CONFIRMED → [dispatch]
 *   агент: in_hotfolder/printing → IN_PRODUCTION, бүгд printed → FINISHING
 */
@Injectable()
export class PrintAutomationService {
  private readonly logger = new Logger(PrintAutomationService.name)
  private running = false

  constructor(
    private readonly network: PrintNetworkService,
    private readonly orders: OrdersService,
    private readonly notifications: NotificationService,
    private readonly inspector: PdfInspectorService,
    @InjectRepository(PrintOrderAutomation) private readonly automation: Repository<PrintOrderAutomation>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Cron('*/30 * * * * *')
  async tick() {
    if (this.running || process.env.PRINT_AUTOMATION === 'off') return
    this.running = true
    try {
      const rows: { id: string }[] = await this.ds.query(
        `SELECT o.id FROM orders o
          WHERE o.payment_status = 'paid'
            AND o.status IN ('pending_file', 'file_review', 'confirmed')
            AND EXISTS (
              SELECT 1 FROM order_items i WHERE i.order_id = o.id::text
                 AND i.product_id IN (SELECT product_id::text FROM print_product_types WHERE product_id IS NOT NULL AND is_active))
            AND NOT EXISTS (SELECT 1 FROM print_tickets t WHERE t.order_id = o.id)
            AND NOT EXISTS (SELECT 1 FROM print_order_automation a WHERE a.order_id = o.id
                              AND a.state IN ('preflight_failed', 'dispatched'))
          ORDER BY o.created_at
          LIMIT 20`,
      )
      for (const r of rows) {
        await this.advance(r.id).catch((e) => this.logger.error(`automation ${r.id}: ${e.message}`))
      }
    } catch (e: any) {
      this.logger.warn(`automation tick skipped: ${e.message}`)
    } finally {
      this.running = false
    }
  }

  /** Нэг захиалгыг боломжтой хэмжээгээр урагшлуулна */
  async advance(orderId: string) {
    let order = await this.orders.getOrderById(orderId)
    const current = await this.automation.findOne({ where: { orderId } })

    if (order.status === OrderStatus.PENDING_FILE) {
      // Хэвлэлийн файл захиалгатай хамт ирсэн тул шууд шалгалтад оруулна
      await this.orders.updateStatus(orderId, OrderStatus.FILE_REVIEW)
      order = await this.orders.getOrderById(orderId)
    }

    if (order.status === OrderStatus.FILE_REVIEW) {
      if (current?.state !== AutomationState.APPROVED) {
        const problems = await this.preflight(orderId)
        if (problems.length) {
          await this.setState(orderId, AutomationState.PREFLIGHT_FAILED, problems.join('; '))
          await this.notifyAdmin(`Файлын шалгалт бүтэлгүй: ${order.invoice_no || orderId.slice(0, 8)}`, problems.join('; '), orderId)
          if (order.customer_id) {
            await this.notifications.create({
              user_id: order.customer_id, type: 'order', title: 'Файлыг шалгаж байна',
              message: 'Таны файлд анхаарах зүйл илэрлээ. Манай мэргэжилтэн шалгаад тантай холбогдоно.',
              data: { order_id: orderId },
            }).catch(() => {})
          }
          return
        }
      }
      await this.orders.updateStatus(orderId, OrderStatus.CONFIRMED)
      order = await this.orders.getOrderById(orderId)
    }

    if (order.status === OrderStatus.CONFIRMED) {
      const res = await this.network.dispatchOrder(orderId, {})
      if (res.created.length) {
        await this.setState(orderId, AutomationState.DISPATCHED, `${res.created.length} тасалбар`)
        return
      }
      const detail = res.skipped.map((s) => s.reason + ((s.rejected ?? []).length
        ? ' — ' + s.rejected!.map((x: any) => `${x.name}: ${x.reasons.join(', ')}`).join(' | ') : '')).join('; ') || 'Хэвлэх мөр алга'
      // Ижил шалтгаанаар админыг давтан бүү зовоо
      if (current?.state !== AutomationState.NO_PRINTER || current.detail !== detail) {
        await this.notifyAdmin(`Принтерт илгээж чадсангүй: ${order.invoice_no || orderId.slice(0, 8)}`, detail, orderId)
      }
      await this.setState(orderId, AutomationState.NO_PRINTER, detail)
    }
  }

  /** Захиалгын PDF файлуудыг шалгаж, ЗӨВХӨН ноцтой асуудлыг буцаана */
  async preflight(orderId: string): Promise<string[]> {
    const items: { specs: any; product_id: string }[] = await this.ds.query(
      `SELECT specs, product_id FROM order_items WHERE order_id = $1`, [orderId],
    )
    const problems: string[] = []
    for (const it of items) {
      const raw = typeof it.specs?.file_url === 'string' ? it.specs.file_url : null
      if (!raw) continue
      const url = safeUploadedFileUrl(raw)
      if (!url) { problems.push('Хэвлэх файл олдсонгүй'); continue }
      const file = path.join(UPLOADS_ROOT, url.replace(/^\/uploads\//, ''))
      if (!file.toLowerCase().endsWith('.pdf')) continue // зураг — DPI-г апп шалгасан
      const size = fs.statSync(file).size
      if (size > PREFLIGHT_MAX_BYTES) continue // маш том — RIP шалгана
      try {
        const r = await this.inspector.inspect(fs.readFileSync(file))
        const errors = (r.issues ?? []).filter((i) => i.severity === 'error').map((i) => i.message)
        if (errors.length || r.risk === 'CRITICAL') problems.push(...(errors.length ? errors : [r.summary]))
      } catch (e: any) {
        problems.push(`PDF уншиж чадсангүй: ${e.message}`)
      }
    }
    return problems
  }

  /** Агентын тасалбарын төлөвийг захиалгын төлөвт тусгана (алдаа гарвал агентыг саатуулахгүй) */
  async onTicketStatus(orderId: string, status: string, ticket: { id: string; error?: string | null }) {
    try {
      const order = await this.orders.getOrderById(orderId)
      if (status === PrintTicketStatus.IN_HOTFOLDER || status === PrintTicketStatus.PRINTING) {
        if (order.status === OrderStatus.CONFIRMED) await this.orders.updateStatus(orderId, OrderStatus.IN_PRODUCTION)
      } else if (status === PrintTicketStatus.PRINTED) {
        const open: { n: number }[] = await this.ds.query(
          `SELECT count(*)::int AS n FROM print_tickets WHERE order_id = $1 AND status IN ('queued', 'claimed', 'in_hotfolder', 'printing')`,
          [orderId],
        )
        if (open[0]?.n) return
        if (order.status === OrderStatus.CONFIRMED) await this.orders.updateStatus(orderId, OrderStatus.IN_PRODUCTION)
        const fresh = await this.orders.getOrderById(orderId)
        if (fresh.status === OrderStatus.IN_PRODUCTION) await this.orders.updateStatus(orderId, OrderStatus.FINISHING)
      } else if (status === PrintTicketStatus.FAILED) {
        await this.notifyAdmin(`Хэвлэлт амжилтгүй: ${order.invoice_no || orderId.slice(0, 8)}`, ticket.error ?? 'Тодорхойгүй алдаа', orderId)
      }
    } catch (e: any) {
      this.logger.warn(`ticket→order sync ${orderId}: ${e.message}`)
    }
  }

  /** Админ preflight-ийн анхааруулгыг үл харгалзан хэвлэхийг зөвшөөрнө */
  async approve(orderId: string) {
    await this.setState(orderId, AutomationState.APPROVED, 'Админ зөвшөөрсөн')
    await this.advance(orderId)
    return this.automation.findOne({ where: { orderId } })
  }

  private async setState(orderId: string, state: AutomationState, detail: string | null) {
    await this.automation.save({ orderId, state, detail })
  }

  private async notifyAdmin(title: string, message: string, orderId: string) {
    await this.notifications.create({ user_id: 'admin', type: 'order', title, message, data: { order_id: orderId, source: 'print-network' } })
      .catch((e) => this.logger.warn(`admin notify failed: ${e.message}`))
  }
}
