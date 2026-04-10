import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  private fmt(n: number) {
    return Number(n).toLocaleString('mn-MN')
  }

  /** Professional BizPrint HTML email wrapper */
  private wrap(title: string, color: string, body: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
  <div style="background:${color};padding:28px 32px">
    <table width="100%"><tr>
      <td><h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">Biz<span style="font-weight:400">Print</span></h1></td>
      <td align="right"><span style="color:rgba(255,255,255,0.7);font-size:12px">${title}</span></td>
    </tr></table>
  </div>
  <div style="padding:32px">${body}</div>
  <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
    <p style="margin:0;color:#9ca3af;font-size:11px">© ${new Date().getFullYear()} BizPrint — Хэвлэлийн үйлчилгээний платформ</p>
    <p style="margin:4px 0 0;color:#9ca3af;font-size:11px">📞 7711-8899 | 📧 info@bizprint.mn</p>
  </div>
</div></body></html>`
  }

  /** Product specs table row */
  private specRow(label: string, value: string | number | null | undefined): string {
    if (!value) return ''
    return `<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">${label}</td><td style="padding:8px 12px;font-weight:600;font-size:13px;color:#111;border-bottom:1px solid #f3f4f6">${value}</td></tr>`
  }

  // ── iCalendar (.ics) үүсгэгч — Google/Apple/Outlook Calendar автоматаар нэмдэг ─
  private generateIcs(params: {
    uid: string
    summary: string
    description: string
    location: string
    startAt: Date
    durationMinutes?: number
    organizer: string
    attendees?: string[]
  }): string {
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const start = params.startAt
    const end = new Date(start.getTime() + (params.durationMinutes || 60) * 60000)
    const attendeeLines = (params.attendees || [])
      .map(email => `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${email}`)
      .join('\r\n')
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BizPrint//BizPrint//MN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${params.uid}@bizprint.mn`,
      `DTSTAMP:${fmt(new Date())}Z`,
      `DTSTART:${fmt(start)}Z`,
      `DTEND:${fmt(end)}Z`,
      `SUMMARY:${params.summary}`,
      `DESCRIPTION:${params.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${params.location}`,
      `ORGANIZER:mailto:${params.organizer}`,
      attendeeLines,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:BizPrint Zoom уулзалт 15 минутын дараа!',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')
  }

  async sendOrderConfirmation(params: {
    to: string
    name: string
    orderId: string
    productName: string
    quantity: number
    total: number
    invoiceCode: string
    specs?: Record<string, string>
  }) {
    const specsHtml = params.specs
      ? Object.entries(params.specs).map(([k, v]) => this.specRow(k, v)).join('')
      : ''

    const body = `
      <h2 style="margin:0 0 8px;color:#111;font-size:20px">Захиалга баталгаажлаа ✓</h2>
      <p style="color:#6b7280;margin:0 0 24px;font-size:14px">Сайн байна уу, <strong>${params.name}</strong>!</p>

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin-bottom:20px">
        <div style="font-size:12px;color:#059669;font-weight:600;margin-bottom:4px">Захиалгын дугаар</div>
        <div style="font-size:20px;font-weight:800;color:#059669">${params.invoiceCode}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr style="background:#f9fafb"><td colspan="2" style="padding:10px 12px;font-weight:700;font-size:14px;color:#111;border-bottom:2px solid #e5e7eb">Захиалгын мэдээлэл</td></tr>
        ${this.specRow('Бүтээгдэхүүн', params.productName)}
        ${this.specRow('Тоо ширхэг', String(params.quantity))}
        ${specsHtml}
        <tr style="background:#fff7ed"><td style="padding:12px;font-weight:700;font-size:14px;color:#111">Нийт дүн</td><td style="padding:12px;font-weight:800;font-size:18px;color:#FF6B00">₮${this.fmt(params.total)}</td></tr>
      </table>

      <p style="color:#6b7280;font-size:13px;line-height:1.6">
        Таны захиалга амжилттай баталгаажлаа. Удахгүй бид тантай холбогдох болно.<br>
        Асуулт байвал <strong>7711-8899</strong> дугаарт холбогдоно уу.
      </p>

      <div style="text-align:center;margin-top:24px">
        <a href="https://bizprint.mn/dashboard/customer/orders" style="display:inline-block;background:#FF6B00;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">Захиалга харах →</a>
      </div>
    `

    await this.mailerService.sendMail({
      to: params.to,
      subject: `BizPrint — Захиалга баталгаажлаа #${params.invoiceCode}`,
      html: this.wrap('Захиалга баталгаажсан', '#FF6B00', body),
    })
  }

  async sendDesignerAssigned(params: {
    to: string
    customerName: string
    designerName: string
    productName: string
    orderId: string
    zoomLink?: string
  }) {
    const zoomHtml = params.zoomLink
      ? '<div style="margin-top:10px"><a href="' + params.zoomLink + '" style="background:#7C3AED;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px">Zoom uulzaltad negdekh</a></div>'
      : ''
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Tanii dizain ajil ekhellee',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">BizPrint - Dizain update</h2>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<h3 style="margin:0 0 16px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
        '<p style="color:#6b7280;margin:0 0 20px">Tanii <strong>' + params.productName + '</strong> buteegedkheenii dizain ajil ekhelleel.</p>' +
        '<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin-bottom:20px">' +
        '<div style="font-size:13px;color:#6b7280;margin-bottom:4px">Dizainer</div>' +
        '<div style="font-size:16px;font-weight:700;color:#7C3AED">' + params.designerName + '</div>' +
        zoomHtml +
        '</div>' +
        '<p style="color:#6b7280;font-size:13px">Dizain duusmagts medegdel irne.</p>' +
        '</div></div>',
    })
  }

  async sendDesignApproved(params: {
    to: string
    customerName: string
    productName: string
    orderId: string
    fileUrl?: string
  }) {
    const fileHtml = params.fileUrl
      ? '<div style="margin-bottom:20px;text-align:center"><a href="' + params.fileUrl + '" style="background:#10B981;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700">Dizain file tatakh</a></div>'
      : ''
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Dizain batlagdlaa - Khevleld orloo',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">BizPrint - Dizain batlagdlaa!</h2>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<h3 style="margin:0 0 16px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
        '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center">' +
        '<div style="font-size:32px;margin-bottom:8px">OK</div>' +
        '<div style="font-size:16px;font-weight:700;color:#16a34a">' + params.productName + '</div>' +
        '<div style="font-size:13px;color:#6b7280;margin-top:4px">Dizain batlagdaj khevleld orloo</div>' +
        '</div>' +
        fileHtml +
        '<p style="color:#6b7280;font-size:13px;text-align:center">Khevlel duusmagts hurgeltin medeelel irne.</p>' +
        '</div></div>',
    })
  }

  async sendDeliveryStarted(params: {
    to: string
    customerName: string
    productName: string
    courierName: string
    courierPhone: string
    address: string
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Tanii zakhialgaa zamdaa!',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#FF6B00,#F59E0B);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">BizPrint - Khurgelt ekhlelle!</h2>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<h3 style="margin:0 0 16px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
        '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px">' +
        '<div style="font-size:15px;font-weight:700;color:#FF6B00;text-align:center;margin-bottom:16px">' + params.productName + ' zamdaa!</div>' +
        '<table style="width:100%">' +
        '<tr><td style="padding:6px;color:#9a3412;font-size:11px;font-weight:600">JOLOOCH</td><td style="padding:6px;color:#9a3412;font-size:11px;font-weight:600">KHAYAG</td></tr>' +
        '<tr><td style="padding:6px"><strong>' + params.courierName + '</strong><br><span style="color:#666">' + params.courierPhone + '</span></td>' +
        '<td style="padding:6px;font-size:13px">' + params.address + '</td></tr>' +
        '</table>' +
        '</div>' +
        '<p style="color:#6b7280;font-size:13px;text-align:center">Asuult baival: <strong>' + params.courierPhone + '</strong></p>' +
        '</div></div>',
    })
  }

  async sendDeliveryCompleted(params: {
    to: string
    customerName: string
    productName: string
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Zakhialgaa khurgegdlee!',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">BizPrint - Khurgegdlee!</h2>' +
        '</div>' +
        '<div style="padding:28px;text-align:center">' +
        '<div style="font-size:48px;margin-bottom:16px">:)</div>' +
        '<h3 style="margin:0 0 8px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
        '<p style="color:#6b7280;margin:0 0 20px">' + params.productName + ' amjilttai khurgegdlee.</p>' +
        '<a href="http://localhost:3000/dashboard" style="background:#10B981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Dashboard kharakh</a>' +
        '</div></div>',
    })
  }

  async sendQuoteToCustomer(q: {
    to: string; name: string; phone?: string; quote_number: string;
    product_name: string; quantity: number;
    unit_price: number; total_price: number; valid_until?: Date;
    breakdown?: any;
    discount_amount?: number; rush_fee?: number; savings_amount?: number;
    urgency?: string; extras?: any; company_name?: string; notes?: string;
    // Product specs
    size?: string; pages?: number; paper_gsm?: number; paper_type?: string;
    color_mode?: string; sides?: string; finishing?: string; binding?: string;
    width_mm?: number; height_mm?: number;
    // PDF attachment (optional)
    pdfBuffer?: Buffer;
  }) {
    const fmt = (n: number) => Number(n || 0).toLocaleString('mn-MN')
    const bd = (q.breakdown && !Array.isArray(q.breakdown)) ? q.breakdown : {}
    const bdLines: { label: string; amount: number }[] = Array.isArray(q.breakdown)
      ? q.breakdown
      : (Array.isArray(bd.lines) ? bd.lines : [])

    const row = (label: string, value: string, labelStyle = '', valueStyle = '') =>
      '<tr>' +
      '<td style="padding:9px 14px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;' + labelStyle + '">' + label + '</td>' +
      '<td style="padding:9px 14px;font-size:13px;border-bottom:1px solid #f3f4f6;text-align:right;' + valueStyle + '">' + value + '</td>' +
      '</tr>'

    const validDate = q.valid_until
      ? new Date(q.valid_until).toLocaleDateString('mn-MN')
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('mn-MN')

    // Cost rows — breakdown object утгыг ашиглана
    const paperCost  = Number(bd.paper_cost  || 0)
    const printCost  = Number(bd.print_cost  || 0)
    const finCost    = Number(bd.finishing_cost || 0)
    const bindCost   = Number(bd.binding_cost || 0)
    const setupCost  = Number(bd.setup_cost  || 0)
    const hasCosts   = paperCost + printCost + finCost + bindCost + setupCost > 0

    const discountAmt = Number(q.discount_amount || 0)
    const rushAmt     = Number(q.rush_fee || 0)

    // Size label
    const sizeLabel = q.size || (q.width_mm && q.height_mm ? `${q.width_mm}×${q.height_mm}мм` : '')

    // Paper label
    const paperLabel = [
      q.finishing && q.finishing !== 'none' ? this.finishingLabel(q.finishing) : '',
      q.paper_gsm ? q.paper_gsm + 'gsm' : '',
      q.paper_type && !q.paper_gsm ? q.paper_type : '',
    ].filter(Boolean).join(' ')

    await this.mailerService.sendMail({
      to: q.to,
      subject: 'BizPrint - ' + q.quote_number + ' - Үнийн санал',
      html:
        '<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +

        // Header
        '<div style="background:linear-gradient(135deg,#FF6B00,#FF8C42);padding:24px 28px;color:#fff">' +
        '<h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px">BizPrint</h1>' +
        '<p style="margin:4px 0 0;opacity:0.85;font-size:13px">Монголын хэвлэлийн platform</p>' +
        '</div>' +

        '<div style="padding:28px">' +

        // Greeting
        '<h2 style="margin:0 0 6px;color:#111;font-size:18px;font-weight:700">Сайн байна уу, ' + q.name + '!</h2>' +
        '<p style="color:#6b7280;margin:0 0 20px;font-size:14px">Таны хэвлэлийн үнийн санал бэлтгэгдлээ.</p>' +

        // Quote number + total box
        '<div style="background:#fff7ed;border:2px solid #FF6B00;border-radius:10px;padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
        '<div style="font-size:11px;color:#9a3412;font-weight:700;letter-spacing:0.5px;text-transform:uppercase">QUOTE DUGAAR</div>' +
        '<div style="font-size:20px;font-weight:800;color:#FF6B00;margin-top:2px">' + q.quote_number + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
        '<div style="font-size:11px;color:#9a3412;font-weight:700;letter-spacing:0.5px;text-transform:uppercase">Нийт төлөх</div>' +
        '<div style="font-size:28px;font-weight:800;color:#FF6B00;line-height:1.1">' + fmt(q.total_price) + '₮</div>' +
        (q.unit_price > 0 ? '<div style="font-size:12px;color:#9a3412">Нэгж: ' + fmt(q.unit_price) + '₮</div>' : '') +
        '</div>' +
        '</div>' +

        // Product info table
        '<h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111;border-bottom:2px solid #e5e7eb;padding-bottom:8px">Бүтээгдэхүүний мэдээлэл</h3>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        row('Бүтээгдэхүүн', q.product_name || '—') +
        (sizeLabel ? row('Хэмжээ', sizeLabel) : '') +
        row('Хэвлэх тоо', fmt(q.quantity) + ' ширхэг') +
        (q.pages ? row('Хуудасны тоо', q.pages + ' хуудас') : '') +
        (paperLabel ? row('Цаас', paperLabel) : '') +
        (q.color_mode ? row('Өнгө', q.color_mode === 'color' ? 'Өнгөт' : 'Хар цагаан') : '') +
        (q.sides ? row('Тал', q.sides === 'double' ? 'Хоёр тал' : 'Нэг тал') : '') +
        (q.finishing && q.finishing !== 'none' ? row('Өнгөлгөө', this.finishingLabel(q.finishing)) : '') +
        (q.binding && q.binding !== 'none' ? row('Хавчих', q.binding) : '') +
        (q.urgency && q.urgency !== 'standard' ? row('Яаралтай', q.urgency === 'rush_24h' ? '24 цаг' : q.urgency === 'rush_48h' ? '48 цаг' : '72 цаг') : '') +
        '</table>' +

        // Cost breakdown
        '<h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111;border-bottom:2px solid #e5e7eb;padding-bottom:8px">Үнийн тооцоолол</h3>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        (hasCosts ? (
          row('Цаасны зардал', fmt(paperCost) + '₮') +
          row('Хэвлэлийн зардал', fmt(printCost) + '₮') +
          (finCost > 0 ? row('Өнгөлгөө зардал', fmt(finCost) + '₮') : '') +
          (bindCost > 0 ? row('Хавтаслалт зардал', fmt(bindCost) + '₮') : '') +
          (setupCost > 0 ? row('Балтгал зардал', fmt(setupCost) + '₮') : '')
        ) : (
          bdLines.map(l =>
            row(l.label, (l.amount < 0 ? '-' : '') + fmt(Math.abs(l.amount)) + '₮',
              '', l.amount < 0 ? 'color:#059669;font-weight:600' : '')
          ).join('')
        )) +
        (discountAmt > 0 ? row('Хөнгөлөлт', '-' + fmt(discountAmt) + '₮', '', 'color:#059669;font-weight:600') : '') +
        (rushAmt > 0 ? row('Яаралтай нэмэгдэл', '+' + fmt(rushAmt) + '₮') : '') +
        '<tr style="background:#f9fafb">' +
        '<td style="padding:12px 14px;font-weight:700;font-size:15px;color:#111;border-top:2px solid #e5e7eb">Нийт төлөх</td>' +
        '<td style="padding:12px 14px;font-weight:800;font-size:20px;color:#FF6B00;text-align:right;border-top:2px solid #e5e7eb">' + fmt(q.total_price) + '₮</td>' +
        '</tr>' +
        '</table>' +

        // Notes
        (q.notes ? (
          '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 14px;margin-bottom:16px">' +
          '<div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px">📝 Тэмдэглэл</div>' +
          '<div style="font-size:13px;color:#78350f">' + q.notes + '</div>' +
          '</div>'
        ) : '') +

        // Validity
        '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;text-align:center;font-size:13px;color:#166534;margin-bottom:16px">' +
        'Үнэ хүчинтэй: <strong>' + validDate + '</strong> хүртэл (3 хоног)' +
        '</div>' +

        // CTA
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;text-align:center;margin-bottom:8px">' +
        '<p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#FF6B00">Үнийн сануулгаа dashboard-аас харах уу?</p>' +
        '<p style="margin:0 0 14px;font-size:12px;color:#6b7280">Данс үүсгээд бүх үнийн санал нэг дээр харах боломжтой</p>' +
        '<a href="http://localhost:3000/register" style="display:inline-block;background:#2563eb;color:#fff;padding:11px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Данс үүсгэх (free) →</a>' +
        '<div style="margin-top:10px;font-size:12px;color:#9ca3af">Бүртгэлтэй бол: <a href="http://localhost:3000/dashboard/customer/quotes" style="color:#2563eb">Dashboard харах</a></div>' +
        '</div>' +

        '</div>' +

        // Footer
        '<div style="background:#f9fafb;padding:14px 28px;text-align:center;border-top:1px solid #e5e7eb">' +
        '<p style="margin:0;font-size:12px;color:#9ca3af">BizPrint - Монголын нэгэн дугаар хэвлэлийн platform</p>' +
        '</div>' +
        '</div>',
      ...(q.pdfBuffer ? {
        attachments: [{
          filename: `BizPrint-Quote-${q.quote_number}.pdf`,
          content: q.pdfBuffer,
          contentType: 'application/pdf',
        }],
      } : {}),
    })
  }

  // Дизайн батлагдсан → үйлдвэрт автомат имэйл
  async sendFactoryProductionOrder(params: {
    to: string
    factoryName?: string
    orderId: string
    productName: string
    quantity: number | string
    fileUrl: string
    customerName: string
    notes?: string
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: `BizPrint - Шинэ хэвлэлийн захиалга - ${params.productName}`,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#8B5CF6,#6D28D9);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">🏭 BizPrint — Хэвлэлийн захиалга</h2>' +
        '<p style="margin:6px 0 0;opacity:0.85">Хэрэглэгч дизайнаа батласан. Хэвлэл эхэлнэ үү.</p>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px">Захиалгын дугаар</td><td style="padding:8px 0;font-weight:700">#' + params.orderId.slice(-8).toUpperCase() + '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Бүтээгдэхүүн</td><td style="padding:8px 0;font-weight:700">' + params.productName + '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Тоо ширхэг</td><td style="padding:8px 0;font-weight:700">' + params.quantity + ' ш</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Захиалагч</td><td style="padding:8px 0">' + params.customerName + '</td></tr>' +
        (params.notes ? '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Тэмдэглэл</td><td style="padding:8px 0">' + params.notes + '</td></tr>' : '') +
        '</table>' +
        '<div style="text-align:center;margin:24px 0">' +
        '<a href="' + params.fileUrl + '" style="background:#8B5CF6;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">📥 Батлагдсан дизайн файл татах</a>' +
        '</div>' +
        '<p style="color:#6b7280;font-size:12px;text-align:center;margin-top:20px">Энэ имэйлийг BizPrint систем автоматаар илгээсэн болно.</p>' +
        '</div></div>',
    })
  }

  // ── Zoom: customer requests a meeting ─────────────────────────────────────

  async sendZoomRequested(params: {
    to: string
    designerName: string
    customerName: string
    productName: string
    preferredAt?: Date
    orderId: string
  }) {
    const timeHtml = params.preferredAt
      ? '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin:16px 0;text-align:center">' +
        '<div style="font-size:12px;color:#1e40af;font-weight:600;margin-bottom:4px">Хэрэглэгчийн хүссэн цаг</div>' +
        '<div style="font-size:17px;font-weight:700;color:#1d4ed8">' +
        new Date(params.preferredAt).toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' }) +
        '</div></div>'
      : '<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:16px 0;text-align:center;color:#92400e;font-size:13px">Хэрэглэгч тодорхой цаг зааагүй — та дурын цагт товлож болно</div>'
    await this.mailerService.sendMail({
      to: params.to,
      subject: `BizPrint — Zoom уулзалтын хүсэлт: ${params.productName}`,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">📹 Zoom уулзалтын хүсэлт</h2>' +
        '<p style="margin:6px 0 0;opacity:0.85">Хэрэглэгч таны дизайны талаар ярилцахыг хүсэж байна</p>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<h3 style="margin:0 0 8px;color:#111">Сайн байна уу, ' + params.designerName + '!</h3>' +
        '<p style="color:#6b7280;margin:0 0 4px;font-size:14px"><strong>' + params.customerName + '</strong> нь <strong>' + params.productName + '</strong> бүтээгдэхүүний дизайны талаар Zoom уулзалт хийхийг хүсэж байна.</p>' +
        timeHtml +
        '<p style="color:#6b7280;font-size:13px">Та Zoom товлоход хэрэглэгч шуурхай мэдэгдэл болон имэйлээр холбоос авна.</p>' +
        '<div style="text-align:center;margin-top:20px">' +
        '<a href="http://localhost:3000/designer/approval" style="background:#3B82F6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Дашборд нээх →</a>' +
        '</div>' +
        '</div></div>',
    })
  }

  // ── Zoom: designer created the meeting ────────────────────────────────────

  async sendZoomCreated(params: {
    to: string
    customerName: string
    designerName: string
    productName: string
    joinUrl: string
    password?: string
    scheduledAt?: Date
    attendeeEmails?: string[]   // customer + designer хоёулыг calendar-т нэмнэ
    meetingId?: string
  }) {
    const timeHtml = params.scheduledAt
      ? '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin:12px 0;text-align:center">' +
        '<div style="font-size:12px;color:#166534;font-weight:600;margin-bottom:4px">Уулзалтын цаг</div>' +
        '<div style="font-size:17px;font-weight:700;color:#16a34a">' +
        new Date(params.scheduledAt).toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' }) +
        '</div></div>'
      : '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 16px;margin:12px 0;text-align:center;color:#166534;font-size:13px;font-weight:600">⚡ Шуурхай уулзалт — одоо нэгдэж болно!</div>'
    const pwHtml = params.password
      ? '<div style="background:#fafafa;border-radius:6px;padding:8px 12px;margin:8px 0;text-align:center;font-size:13px;color:#374151">Нууц үг: <strong style="color:#111;letter-spacing:2px">' + params.password + '</strong></div>'
      : ''
    // .ics calendar invite үүсгэх
    const calendarStart = params.scheduledAt || new Date(Date.now() + 5 * 60000)
    const icsContent = this.generateIcs({
      uid: params.meetingId || `zoom-${Date.now()}`,
      summary: `📹 BizPrint Zoom — ${params.productName}`,
      description: `Дизайнер: ${params.designerName}\\nЗагвар: ${params.productName}\\nZoom линк: ${params.joinUrl}${params.password ? `\\nНууц үг: ${params.password}` : ''}`,
      location: params.joinUrl,
      startAt: calendarStart,
      durationMinutes: 60,
      organizer: 'bizprintpro@gmail.com',
      attendees: params.attendeeEmails || [params.to],
    })

    await this.mailerService.sendMail({
      to: params.to,
      subject: `📹 BizPrint — Zoom уулзалт бэлэн! ${params.productName}`,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">📹 Zoom уулзалт товлогдлоо!</h2>' +
        '<p style="margin:6px 0 0;opacity:0.85">Дизайнер дэлгэцээ share хийж хамтдаа хянана</p>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<h3 style="margin:0 0 8px;color:#111">Сайн байна уу, ' + params.customerName + '!</h3>' +
        '<p style="color:#6b7280;margin:0 0 4px;font-size:14px">Таны <strong>' + params.productName + '</strong> дизайны Zoom уулзалтыг <strong>' + params.designerName + '</strong> товлолоо.</p>' +
        timeHtml +
        pwHtml +
        '<div style="text-align:center;margin:20px 0">' +
        '<a href="' + params.joinUrl + '" style="background:#10B981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">📹 Zoom-д нэгдэх →</a>' +
        '</div>' +
        '<div style="background:#f0fdf4;border-radius:8px;padding:12px 16px;margin:12px 0;text-align:center">' +
        '<p style="margin:0;font-size:13px;color:#166534">📅 Хавсаргасан <strong>.ics файлыг</strong> нээж Google/Apple Calendar-т нэмнэ үү</p>' +
        '</div>' +
        '<p style="color:#9ca3af;font-size:12px;text-align:center">Дизайнер ажлын дэлгэцээ share хийж загварыг хамтдаа хянах болно.</p>' +
        '</div></div>',
      attachments: [
        {
          filename: `bizprint-zoom-${params.productName.replace(/\s+/g, '-')}.ics`,
          content: icsContent,
          contentType: 'text/calendar; method=REQUEST',
        },
      ],
    })
  }

  // ── Zoom: 15-min reminder before meeting ──────────────────────────────────

  async sendMeetingReminder(params: {
    to: string
    customerName: string
    productName: string
    joinUrl: string
    password?: string
    scheduledAt?: Date
    orderId: string
  }) {
    const timeStr = params.scheduledAt
      ? new Date(params.scheduledAt).toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' })
      : 'Удахгүй'
    const pwHtml = params.password
      ? '<div style="background:#fafafa;border-radius:6px;padding:8px 12px;margin:8px 0;text-align:center;font-size:13px;color:#374151">Нууц үг: <strong style="color:#111;letter-spacing:2px">' + params.password + '</strong></div>'
      : ''

    await this.mailerService.sendMail({
      to: params.to,
      subject: `⏰ BizPrint — Zoom уулзалт 15 минутын дараа! ${params.productName}`,
      html: this.wrap('Уулзалтын сануулга', '#2563EB',
        '<div style="text-align:center;margin-bottom:20px">' +
        '<div style="font-size:48px;margin-bottom:8px">⏰</div>' +
        '<h2 style="margin:0;color:#111;font-size:20px">Уулзалт эхлэхэд бэлэн боллоо!</h2>' +
        '</div>' +
        '<p style="color:#374151;font-size:14px;text-align:center;margin:0 0 16px">' +
        '<strong>' + params.customerName + '</strong>, таны <strong>' + params.productName + '</strong> захиалгын Zoom уулзалт <strong>15 минутын дараа</strong> эхэлнэ.' +
        '</p>' +
        '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;text-align:center;margin-bottom:16px">' +
        '<div style="font-size:12px;color:#1e40af;font-weight:600;margin-bottom:4px">Уулзалтын цаг</div>' +
        '<div style="font-size:20px;font-weight:700;color:#1d4ed8">' + timeStr + '</div>' +
        '</div>' +
        pwHtml +
        '<div style="text-align:center;margin:20px 0">' +
        '<a href="' + params.joinUrl + '" style="background:#2563EB;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">📹 Zoom-д нэгдэх →</a>' +
        '</div>' +
        '<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:10px 16px;text-align:center;font-size:12px;color:#92400e">' +
        '💡 Интернэт холболтоо шалгаж, камер, микрофоноо бэлтгэнэ үү' +
        '</div>',
      ),
    })
  }

  async sendPasswordReset(params: { to: string; name: string; resetUrl: string; expiresHours: number }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint — Нууц үг сэргээх',
      html: this.wrap('Нууц үг сэргээх', '#FF6B00',
        '<div style="text-align:center;margin-bottom:16px">' +
        '<div style="font-size:48px;margin-bottom:8px">🔐</div>' +
        '<h2 style="margin:0;color:#111;font-size:20px">Нууц үг сэргээх хүсэлт</h2>' +
        '</div>' +
        '<p style="color:#374151;font-size:14px;text-align:center;margin:0 0 20px">' +
        'Сайн байна уу, <strong>' + (params.name || '') + '</strong>! Та нууц үг сэргээх хүсэлт илгээсэн байна.</p>' +
        '<div style="text-align:center;margin:24px 0">' +
        '<a href="' + params.resetUrl + '" style="display:inline-block;padding:14px 32px;background:#FF6B00;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">' +
        'Нууц үг сэргээх</a></div>' +
        '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;text-align:center;font-size:12px;color:#9a3412;margin-top:16px">' +
        '⏰ Энэ линк ' + params.expiresHours + ' цагийн дотор хүчинтэй. Нэг л удаа ашиглах боломжтой.</div>' +
        '<p style="font-size:12px;color:#999;text-align:center;margin-top:16px">' +
        'Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.</p>',
      ),
    })
  }

  private finishingLabel(finishing: string): string {
    const map: Record<string, string> = {
      mat:       'Мат ламинат',
      gloss:     'Глосс ламинат',
      uv:        'УВ лак',
      soft_touch:'Soft touch',
      spot_uv:   'Spot UV',
      none:      '',
    }
    return map[finishing] || finishing
  }

  async sendDailyReport(adminEmail: string, quotes: any[], date: string) {
    const total = quotes.reduce((s, q) => s + Number(q.total_price), 0)
    const fmt = (n: number) => Number(n).toLocaleString('mn-MN')
    await this.mailerService.sendMail({
      to: adminEmail,
      subject: 'BizPrint - ' + date + ' - ' + quotes.length + ' uniin sanal',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
        '<div style="background:#FF6B00;padding:24px;color:#fff"><h2 style="margin:0">BizPrint - Odoriin tailan</h2><p style="margin:4px 0 0">' + date + '</p></div>' +
        '<div style="padding:24px">' +
        '<p>Niit quote: <strong>' + quotes.length + '</strong></p>' +
        '<p>Niit dun: <strong style="color:#FF6B00">' + fmt(total) + 'T</strong></p>' +
        '</div></div>',
    })
  }

  // ── File Rejection Notification ─────────────────────────────────────────────
  async sendFileRejectionNotice(params: {
    to: string
    name: string
    orderId: string
    productName: string
    reason?: string
  }) {
    const { to, name, orderId, productName, reason } = params
    await this.mailerService.sendMail({
      to,
      subject: `BizPrint - Файл буцаагдлаа (${productName})`,
      html:
        '<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +

        // Header
        '<div style="background:linear-gradient(135deg,#FF6B00,#FF8C42);padding:24px 28px;color:#fff">' +
        '<h1 style="margin:0;font-size:22px;font-weight:800">BizPrint</h1>' +
        '<p style="margin:4px 0 0;opacity:0.85;font-size:13px">Хэвлэх файл буцаагдлаа</p>' +
        '</div>' +

        '<div style="padding:28px">' +

        '<h2 style="margin:0 0 6px;color:#111;font-size:18px">Сайн байна уу, ' + name + '!</h2>' +
        '<p style="color:#6b7280;font-size:14px;margin:0 0 20px">Таны оруулсан хэвлэх файл шалгалтаар тэнцсэнгүй. Дахин оруулна уу.</p>' +

        // Order info
        '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:20px">' +
        '<div style="font-size:13px;color:#991b1b;font-weight:700">❌ Файл буцаагдлаа</div>' +
        '<div style="font-size:14px;color:#111;margin-top:8px"><strong>Бүтээгдэхүүн:</strong> ' + productName + '</div>' +
        (reason ? '<div style="font-size:13px;color:#6b7280;margin-top:6px"><strong>Шалтгаан:</strong> ' + reason + '</div>' : '') +
        '</div>' +

        // Instructions
        '<div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:20px">' +
        '<div style="font-size:13px;font-weight:700;color:#111;margin-bottom:8px">Юу хийх вэ?</div>' +
        '<div style="font-size:13px;color:#6b7280;line-height:1.6">' +
        '1. Файлаа 300 DPI, CMYK, 3мм bleed-тэй бэлдэнэ үү<br>' +
        '2. PDF файл embed хийсэн фонттой байх ёстой<br>' +
        '3. Dashboard-аас дахин оруулна уу' +
        '</div>' +
        '</div>' +

        // CTA
        '<div style="text-align:center;margin:24px 0">' +
        '<a href="http://localhost:3000/dashboard/orders" style="background:#FF6B00;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">Файл дахин оруулах →</a>' +
        '</div>' +

        '<p style="color:#9ca3af;font-size:12px;text-align:center">BizPrint систем автоматаар илгээсэн.</p>' +
        '</div>' +

        '<div style="background:#f9fafb;padding:14px 28px;text-align:center;border-top:1px solid #e5e7eb">' +
        '<p style="margin:0;font-size:12px;color:#9ca3af">BizPrint - Монголын хэвлэлийн platform</p>' +
        '</div>' +
        '</div>',
    })
  }

  // ── File Approval Notification ─────────────────────────────────────────────
  async sendFileApprovalNotice(params: {
    to: string
    name: string
    orderId: string
    productName: string
  }) {
    const { to, name, orderId, productName } = params
    await this.mailerService.sendMail({
      to,
      subject: `BizPrint - Файл зөвшөөрөгдлөө! (${productName})`,
      html:
        '<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +

        '<div style="background:linear-gradient(135deg,#059669,#10B981);padding:24px 28px;color:#fff">' +
        '<h1 style="margin:0;font-size:22px;font-weight:800">BizPrint</h1>' +
        '<p style="margin:4px 0 0;opacity:0.85;font-size:13px">Хэвлэх файл зөвшөөрөгдлөө!</p>' +
        '</div>' +

        '<div style="padding:28px">' +
        '<h2 style="margin:0 0 6px;color:#111;font-size:18px">Сайн байна уу, ' + name + '!</h2>' +
        '<p style="color:#6b7280;font-size:14px;margin:0 0 20px">Таны оруулсан хэвлэх файл амжилттай шалгагдлаа. Захиалга үйлдвэрлэлд орно.</p>' +

        '<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px 20px;margin-bottom:20px">' +
        '<div style="font-size:13px;color:#065f46;font-weight:700">✅ Файл зөвшөөрөгдсөн</div>' +
        '<div style="font-size:14px;color:#111;margin-top:8px"><strong>Бүтээгдэхүүн:</strong> ' + productName + '</div>' +
        '</div>' +

        '<div style="text-align:center;margin:24px 0">' +
        '<a href="http://localhost:3000/dashboard/orders" style="background:#059669;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">Захиалгын явц харах →</a>' +
        '</div>' +

        '<p style="color:#9ca3af;font-size:12px;text-align:center">BizPrint систем автоматаар илгээсэн.</p>' +
        '</div>' +

        '<div style="background:#f9fafb;padding:14px 28px;text-align:center;border-top:1px solid #e5e7eb">' +
        '<p style="margin:0;font-size:12px;color:#9ca3af">BizPrint - Монголын хэвлэлийн platform</p>' +
        '</div>' +
        '</div>',
    })
  }

  // ── Pending File Notification (request customer to upload) ─────────────────
  async sendFileRequestNotice(params: {
    to: string
    name: string
    orderId: string
    productName: string
  }) {
    const { to, name, orderId, productName } = params
    await this.mailerService.sendMail({
      to,
      subject: `BizPrint - Хэвлэх файлаа оруулна уу (${productName})`,
      html:
        '<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +

        '<div style="background:linear-gradient(135deg,#FF6B00,#FF8C42);padding:24px 28px;color:#fff">' +
        '<h1 style="margin:0;font-size:22px;font-weight:800">BizPrint</h1>' +
        '<p style="margin:4px 0 0;opacity:0.85;font-size:13px">Хэвлэх файл шаардлагатай</p>' +
        '</div>' +

        '<div style="padding:28px">' +
        '<h2 style="margin:0 0 6px;color:#111;font-size:18px">Сайн байна уу, ' + name + '!</h2>' +
        '<p style="color:#6b7280;font-size:14px;margin:0 0 20px">Таны захиалга баталгаажсан. Хэвлэх файлаа оруулна уу.</p>' +

        '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin-bottom:20px">' +
        '<div style="font-size:13px;color:#9a3412;font-weight:700">📁 Файл хүлээж байна</div>' +
        '<div style="font-size:14px;color:#111;margin-top:8px"><strong>Бүтээгдэхүүн:</strong> ' + productName + '</div>' +
        '</div>' +

        '<div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:20px">' +
        '<div style="font-size:13px;font-weight:700;color:#111;margin-bottom:8px">Файлын шаардлага:</div>' +
        '<div style="font-size:13px;color:#6b7280;line-height:1.6">' +
        '• PDF, AI, EPS, TIFF, JPG, PNG формат<br>' +
        '• 300 DPI (хэвлэлийн чанар)<br>' +
        '• CMYK өнгөний горим<br>' +
        '• 3мм bleed (хэвлэлийн зай)<br>' +
        '• Фонт embed хийсэн байх' +
        '</div>' +
        '</div>' +

        '<div style="text-align:center;margin:24px 0">' +
        '<a href="http://localhost:3000/dashboard/orders" style="background:#FF6B00;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">Файл оруулах →</a>' +
        '</div>' +

        '<p style="color:#9ca3af;font-size:12px;text-align:center">BizPrint систем автоматаар илгээсэн.</p>' +
        '</div>' +

        '<div style="background:#f9fafb;padding:14px 28px;text-align:center;border-top:1px solid #e5e7eb">' +
        '<p style="margin:0;font-size:12px;color:#9ca3af">BizPrint - Монголын хэвлэлийн platform</p>' +
        '</div>' +
        '</div>',
    })
  }

  // ── Batch Quote Email: олон quote нэг имэйлд ──────────────────────────────
  async sendBatchQuoteEmail(to: string, name: string, quotes: any[]) {
    const fmt = (n: number) => Number(n || 0).toLocaleString('mn-MN')
    const total = quotes.reduce((s, q) => s + Number(q.total_price || 0), 0)

    const quotesHtml = quotes.map((q, i) =>
      '<tr>' +
      '<td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#78716C">' + (i + 1) + '</td>' +
      '<td style="padding:10px 14px;border-bottom:1px solid #f3f4f6">' +
        '<div style="font-weight:700;font-size:14px">' + (q.product_name || 'Бүтээгдэхүүн') + '</div>' +
        '<div style="font-size:12px;color:#78716C">' + (q.dimensions || '') + (q.quantity ? ' · ' + q.quantity + ' ш' : '') + '</div>' +
      '</td>' +
      '<td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:13px">' + (q.quantity || 1) + '</td>' +
      '<td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;text-align:right;font-size:13px">' + fmt(Number(q.unit_price || 0)) + '₮</td>' +
      '<td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#FF6B00;font-size:14px">' + fmt(Number(q.total_price || 0)) + '₮</td>' +
      '</tr>'
    ).join('')

    const quoteNumbers = quotes.map(q => q.quote_number).join(', ')

    await this.mailerService.sendMail({
      to,
      subject: `BizPrint - ${quotes.length} үнийн санал (${quoteNumbers})`,
      html:
        '<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +

        // Header
        '<div style="background:linear-gradient(135deg,#FF6B00,#FF8C42);padding:24px 28px;color:#fff">' +
        '<h1 style="margin:0;font-size:22px;font-weight:800">BizPrint</h1>' +
        '<p style="margin:4px 0 0;opacity:0.85;font-size:13px">Монголын хэвлэлийн platform</p>' +
        '</div>' +

        '<div style="padding:28px">' +

        // Greeting
        '<h2 style="margin:0 0 6px;color:#111;font-size:18px;font-weight:700">Сайн байна уу, ' + name + '!</h2>' +
        '<p style="color:#6b7280;margin:0 0 20px;font-size:14px">Таны <strong>' + quotes.length + '</strong> хэвлэлийн үнийн санал бэлтгэгдлээ.</p>' +

        // Total box
        '<div style="background:#fff7ed;border:2px solid #FF6B00;border-radius:10px;padding:16px 20px;margin-bottom:20px;text-align:center">' +
        '<div style="font-size:11px;color:#9a3412;font-weight:700;letter-spacing:0.5px;text-transform:uppercase">НИЙТ ДҮН</div>' +
        '<div style="font-size:32px;font-weight:800;color:#FF6B00;margin-top:4px">' + fmt(total) + '₮</div>' +
        '<div style="font-size:12px;color:#9a3412;margin-top:2px">' + quotes.length + ' бүтээгдэхүүн · Хүчинтэй хугацаа: 3 хоног</div>' +
        '</div>' +

        // Quotes table
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        '<thead><tr>' +
        '<th style="padding:10px 14px;text-align:left;font-size:11px;color:#9ca3af;border-bottom:2px solid #e5e7eb;font-weight:600">#</th>' +
        '<th style="padding:10px 14px;text-align:left;font-size:11px;color:#9ca3af;border-bottom:2px solid #e5e7eb;font-weight:600">Бүтээгдэхүүн</th>' +
        '<th style="padding:10px 14px;text-align:center;font-size:11px;color:#9ca3af;border-bottom:2px solid #e5e7eb;font-weight:600">Тоо</th>' +
        '<th style="padding:10px 14px;text-align:right;font-size:11px;color:#9ca3af;border-bottom:2px solid #e5e7eb;font-weight:600">Нэгж үнэ</th>' +
        '<th style="padding:10px 14px;text-align:right;font-size:11px;color:#9ca3af;border-bottom:2px solid #e5e7eb;font-weight:600">Нийт</th>' +
        '</tr></thead>' +
        '<tbody>' + quotesHtml + '</tbody>' +
        '<tfoot><tr>' +
        '<td colspan="4" style="padding:12px 14px;text-align:right;font-weight:700;font-size:15px;border-top:2px solid #e5e7eb">НИЙТ:</td>' +
        '<td style="padding:12px 14px;text-align:right;font-weight:800;font-size:18px;color:#FF6B00;border-top:2px solid #e5e7eb">' + fmt(total) + '₮</td>' +
        '</tr></tfoot>' +
        '</table>' +

        // Individual quote numbers
        '<div style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:16px">' +
        '<div style="font-size:11px;color:#6b7280;font-weight:600;margin-bottom:6px">QUOTE ДУГААРУУД</div>' +
        quotes.map(q =>
          '<span style="display:inline-block;background:#fff7ed;color:#FF6B00;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;margin:2px 4px">' + q.quote_number + '</span>'
        ).join('') +
        '</div>' +

        // CTA
        '<div style="text-align:center;margin:24px 0">' +
        '<a href="http://localhost:3000/quote" style="background:#FF6B00;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">Захиалга үүсгэх →</a>' +
        '</div>' +

        '<p style="color:#9ca3af;font-size:12px;text-align:center;margin:16px 0 0">Энэ имэйлийг BizPrint систем автоматаар илгээсэн болно.</p>' +
        '</div>' +

        '<div style="background:#f9fafb;padding:14px 28px;text-align:center;border-top:1px solid #e5e7eb">' +
        '<p style="margin:0;font-size:12px;color:#9ca3af">BizPrint - Монголын нэгэн дугаар хэвлэлийн platform</p>' +
        '</div>' +
        '</div>',
    })
  }

  // ── Vendor-д шинэ захиалга assign хийгдсэн мэдэгдэл ─────────────────
  async sendVendorOrderAssigned(params: {
    to: string
    vendorName: string
    orderId: string
    productName: string
    quantity: number | string
    customerName: string
    fileUrl?: string
    deadline?: string
    notes?: string
  }) {
    const fileButton = params.fileUrl
      ? '<div style="text-align:center;margin:20px 0"><a href="' + params.fileUrl + '" style="background:#FF6B00;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">📥 Дизайн файл татах</a></div>'
      : '<p style="color:#F59E0B;font-size:13px;text-align:center;margin:16px 0">⚠️ Дизайн файл дараа илгээгдэнэ</p>'

    await this.mailerService.sendMail({
      to: params.to,
      subject: `BizPrint — Шинэ захиалга: ${params.productName} × ${params.quantity}`,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#FF6B00,#F59E0B);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">📦 Шинэ захиалга ирлээ!</h2>' +
        '<p style="margin:6px 0 0;opacity:0.85">Танд шинэ хэвлэлийн захиалга хуваарилагдлаа</p>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<h3 style="margin:0 0 16px;color:#111">Сайн байна уу, ' + (params.vendorName || 'Vendor') + '!</h3>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        '<tr><td style="padding:10px 0;color:#6b7280;font-size:13px;width:140px;border-bottom:1px solid #f3f4f6">Захиалгын дугаар</td><td style="padding:10px 0;font-weight:700;border-bottom:1px solid #f3f4f6">#' + params.orderId.slice(-8).toUpperCase() + '</td></tr>' +
        '<tr><td style="padding:10px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">Бүтээгдэхүүн</td><td style="padding:10px 0;font-weight:700;border-bottom:1px solid #f3f4f6">' + params.productName + '</td></tr>' +
        '<tr><td style="padding:10px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">Тоо ширхэг</td><td style="padding:10px 0;font-weight:700;border-bottom:1px solid #f3f4f6">' + params.quantity + ' ш</td></tr>' +
        '<tr><td style="padding:10px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">Захиалагч</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">' + params.customerName + '</td></tr>' +
        (params.deadline ? '<tr><td style="padding:10px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">Хугацаа</td><td style="padding:10px 0;font-weight:700;color:#EF4444;border-bottom:1px solid #f3f4f6">' + params.deadline + '</td></tr>' : '') +
        (params.notes ? '<tr><td style="padding:10px 0;color:#6b7280;font-size:13px">Тэмдэглэл</td><td style="padding:10px 0">' + params.notes + '</td></tr>' : '') +
        '</table>' +
        fileButton +
        '<p style="color:#6b7280;font-size:12px;text-align:center;margin-top:24px">Энэ имэйлийг BizPrint систем автоматаар илгээсэн.</p>' +
        '</div></div>',
    })
  }

  // ── Ерөнхий мэдэгдэл (broadcast, system notification) ────────────────
  async sendGenericNotification(params: {
    to: string
    name: string
    title: string
    message: string
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: `BizPrint — ${params.title}`,
      html: this.buildEmailTemplate({
        title: params.title,
        name: params.name,
        body: `<div style="background:#F3F4F6;border-radius:8px;padding:20px 24px;margin:0 0 24px;line-height:1.7;color:#374151;font-size:15px">${params.message}</div>`,
        ctaText: 'BizPrint нээх',
        ctaUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      }),
    })
  }

  /* ═══════════════════════════════════════
   *  SHARED EMAIL TEMPLATE — мэргэжлийн загвар
   *  Бүх имэйлд ашиглах боломжтой
   * ═══════════════════════════════════════ */

  private buildEmailTemplate(params: {
    title: string
    name: string
    body: string
    ctaText?: string
    ctaUrl?: string
    footerExtra?: string
  }): string {
    const cta = params.ctaText && params.ctaUrl
      ? `<div style="text-align:center;margin:28px 0 8px">` +
        `<a href="${params.ctaUrl}" style="display:inline-block;background:#FF6B00;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px">${params.ctaText}</a>` +
        `</div>`
      : ''

    return `<!DOCTYPE html>
<html lang="mn">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

<!-- Header -->
<tr><td style="background:#FF6B00;padding:28px 32px;text-align:center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="text-align:center">
      <span style="font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:0.5px">Biz<span style="font-weight:400">Print</span></span>
    </td>
  </tr></table>
  <div style="margin-top:12px;font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:0.3px">${params.title}</div>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 36px 24px">
  <h2 style="margin:0 0 20px;color:#333333;font-size:20px;font-weight:700;line-height:1.3">Сайн байна уу, ${params.name}!</h2>
  ${params.body}
  ${cta}
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 36px"><div style="border-top:1px solid #E5E7EB"></div></td></tr>

<!-- Footer -->
<tr><td style="padding:20px 36px 28px;text-align:center">
  ${params.footerExtra || ''}
  <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.6">Энэхүү имэйлийг <strong>BizPrint</strong> системээс автоматаар илгээсэн тул хариу бичих шаардлагагүй.</p>
  <p style="margin:8px 0 0;color:#D1D5DB;font-size:11px">&copy; ${new Date().getFullYear()} BizPrint. Бүх эрх хуулиар хамгаалагдсан.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
  }

  async sendInquiryConfirmation(inquiry: any): Promise<void> {
    if (!inquiry.customer_email) return
    try {
      await this.mailerService.sendMail({
        to: inquiry.customer_email,
        subject: `BizPrint — Захиалгын хүсэлт #${inquiry.inquiry_number} хүлээн авлаа`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#FF6B00;padding:20px;text-align:center"><h1 style="color:white;margin:0">BizPrint</h1></div>
          <div style="padding:30px">
            <h2>Захиалгын хүсэлт хүлээн авлаа!</h2>
            <p>Сайн байна уу, <strong>${inquiry.customer_name || 'Харилцагч'}</strong></p>
            <p>Таны захиалгын хүсэлт амжилттай хүлээн авагдлаа.</p>
            <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0">
              <p><strong>Захиалгын дугаар:</strong> ${inquiry.inquiry_number}</p>
              <p><strong>Бүтээгдэхүүн:</strong> ${inquiry.product_name || inquiry.category || '—'}</p>
              <p><strong>Тираж:</strong> ${inquiry.quantity || '—'}</p>
            </div>
            <p>Бид 30 минутын дотор тантай холбогдоно.</p>
          </div>
          <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#666">© 2026 BizPrint — bizprint.mn</div>
        </div>`,
      })
    } catch (e: any) { console.error('Inquiry email error:', e.message) }
  }

  async sendInquiryStatusUpdate(params: { email: string; name: string; inquiryNumber: string; status: string }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: params.email,
        subject: `BizPrint — Захиалга #${params.inquiryNumber} шинэчлэгдлээ`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#FF6B00;padding:20px;text-align:center"><h1 style="color:white;margin:0">BizPrint</h1></div>
          <div style="padding:30px">
            <h2>Захиалгын мэдэгдэл</h2>
            <p>Сайн байна уу, <strong>${params.name}</strong></p>
            <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0">
              <p><strong>Захиалгын дугаар:</strong> ${params.inquiryNumber}</p>
              <p><strong>Шинэ статус:</strong> ${params.status}</p>
            </div>
          </div>
        </div>`,
      })
    } catch (e: any) { console.error('Status email error:', e.message) }
  }
}