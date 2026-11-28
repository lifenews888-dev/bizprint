import { Injectable, Logger } from '@nestjs/common'
import { createHmac } from 'crypto'

/**
 * bizprint.mn захиалгыг Prinity Cloud руу бичнэ.
 * PRINITY_ORDER_URL (эх, ж: https://prinity-cloud-production.up.railway.app) болон
 * PRINITY_ORDER_SECRET заагаагүй бол юу ч илгээхгүй. Алдаа нь худалдан авагчийн захиалгыг зогсоохгүй.
 */
@Injectable()
export class PrinityOrderClient {
  private readonly logger = new Logger(PrinityOrderClient.name)

  async mirror(order: any, items?: any[]) {
    const lines = (items && items.length ? items : [order]).map((it) => this.line(it, order))
    return this.send('/hooks/bizprint/orders', {
      ext_id: order?.id,
      quote_no: order?.quote_number || null,
      customer: {
        name: order?.customer_name || order?.customer?.full_name || null,
        phone: order?.customer_phone || order?.customer?.phone || null,
        email: order?.customer_email || order?.customer?.email || null,
      },
      items: lines,
      subtotal: this.num(order?.total_price),
      shipping_fee: 0,
      total: this.num(order?.total_price),
      payment_status: order?.payment_status === 'paid' ? 'paid' : 'unpaid',
      method: order?.payment_method || null,
      notes: order?.notes || null,
      shipping: { method: 'pickup' },
    })
  }

  async markPaid(extId: string, { amount, method, ref }: { amount?: number; method?: string; ref?: string } = {}) {
    return this.send('/hooks/bizprint/paid', { ext_id: extId, amount: amount ?? null, method: method || null, ref: ref || null })
  }

  private line(it: any, order: any) {
    const specs = it?.specs || {}
    const qty = Math.max(1, Math.round(this.num(it?.quantity ?? it?.qty ?? order?.quantity) || 1))
    const unit = this.num(it?.unit_price ?? it?.customer_price ?? order?.unit_price)
    const line = this.num(it?.total_price ?? it?.line_total ?? unit * qty)
    return {
      name: specs.product_name || specs.product_type_name || specs.name || it?.product?.name || order?.product_name || 'Хэвлэл',
      qty,
      unit_price: unit,
      line_total: line,
      width_mm: specs.width_mm ?? it?.width_mm ?? order?.width_mm ?? null,
      height_mm: specs.height_mm ?? it?.height_mm ?? order?.height_mm ?? null,
      specs: {
        product_type_name: specs.product_type_name || specs.productType || null,
        product_name: specs.product_name || order?.product_name || null,
        media_name: specs.media_name || specs.media || null,
        sides: specs.sides || order?.sides || null,
        color_mode: specs.color_mode || order?.color_mode || null,
        paper_gsm: specs.paper_gsm || order?.paper_gsm || null,
        finishing: specs.finishing || order?.finishing || null,
      },
    }
  }

  private num(v: any) {
    const n = Number(v)
    return Number.isFinite(n) ? Math.round(n) : 0
  }

  private async send(path: string, payload: any) {
    const base = String(process.env.PRINITY_ORDER_URL || '').trim().replace(/\/+$/, '')
    const secret = String(process.env.PRINITY_ORDER_SECRET || '').trim()
    if (!base || !secret || !payload?.ext_id) return { skipped: true }
    const raw = JSON.stringify(payload)
    const ts = Math.floor(Date.now() / 1000)
    const v1 = createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex')
    try {
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-bizprint-signature': `t=${ts},v1=${v1}` },
        body: raw,
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        this.logger.warn(`Prinity ${path} ${res.status} ${text.slice(0, 180)}`)
        return { ok: false, status: res.status }
      }
      return { ok: true }
    } catch (e: any) {
      this.logger.warn(`Prinity ${path} холбогдсонгүй: ${e?.message || e}`)
      return { ok: false }
    }
  }
}
