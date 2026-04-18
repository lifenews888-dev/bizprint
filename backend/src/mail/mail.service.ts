import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

const BRAND = '#FF6B00'

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  private fmt(n: number) {
    return Number(n).toLocaleString('mn-MN')
  }

  private header(color = BRAND, title = 'BizPrint') {
    return (
      `<div style="background:${color};padding:24px 32px;color:#fff">` +
      `<h2 style="margin:0;font-size:22px">${title}</h2></div>`
    )
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
      subject: `BizPrint — Захиалга баталгаажлаа — ${params.invoiceCode}`,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        this.header(BRAND, 'BizPrint') +
        '<div style="padding:28px">' +
        `<h3 style="margin:0 0 12px;color:#111">Сайн байна уу, ${params.name}!</h3>` +
        `<p style="color:#6b7280">Таны захиалга <strong style="color:#111">${params.invoiceCode}</strong> амжилттай баталгаажлаа.</p>` +
        '<table style="width:100%;border-collapse:collapse;margin-top:16px">' +
        `<tr style="background:#f9fafb"><td style="padding:10px 12px;color:#6b7280;font-size:13px">Бүтээгдэхүүн</td><td style="padding:10px 12px;font-weight:600">${params.productName}</td></tr>` +
        `<tr><td style="padding:10px 12px;color:#6b7280;font-size:13px">Тоо ширхэг</td><td style="padding:10px 12px;font-weight:600">${params.quantity} ш</td></tr>` +
        `<tr style="background:#fff7ed"><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:700">Нийт дүн</td><td style="padding:10px 12px;color:${BRAND};font-weight:800;font-size:16px">${this.fmt(params.total)}₮</td></tr>` +
        '</table>' +
        '<div style="margin-top:24px;text-align:center">' +
        '<a href="http://bizprint.mn/order" style="background:#111;color:#fff;padding:11px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Захиалга харах</a>' +
        '</div>' +
        '</div></div>',
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
      ? `<div style="margin-top:12px"><a href="${params.zoomLink}" style="background:#7C3AED;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">Zoom уулзалтад нэгдэх</a></div>`
      : ''
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint — Таны дизайн ажил эхэллээ',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        this.header('linear-gradient(135deg,#8B5CF6,#7C3AED)', 'BizPrint — Дизайн') +
        '<div style="padding:28px">' +
        `<h3 style="margin:0 0 12px;color:#111">Сайн байна уу, ${params.customerName}!</h3>` +
        `<p style="color:#6b7280;margin:0 0 20px">Таны <strong style="color:#111">${params.productName}</strong> бүтээгдэхүүний дизайн ажил эхэллээ.</p>` +
        '<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin-bottom:20px">' +
        '<div style="font-size:12px;color:#7C3AED;font-weight:600;margin-bottom:4px;text-transform:uppercase">Дизайнер</div>' +
        `<div style="font-size:16px;font-weight:700;color:#7C3AED">${params.designerName}</div>` +
        zoomHtml +
        '</div>' +
        '<p style="color:#6b7280;font-size:13px">Дизайн дуусмагц мэдэгдэл ирнэ.</p>' +
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
      ? `<div style="margin-bottom:20px;text-align:center"><a href="${params.fileUrl}" style="background:#10B981;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:700">Дизайн файл татах</a></div>`
      : ''
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint — Дизайн батлагдлаа — Хэвлэлд орлоо',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        this.header('linear-gradient(135deg,#10B981,#059669)', 'BizPrint — Дизайн батлагдлаа!') +
        '<div style="padding:28px">' +
        `<h3 style="margin:0 0 12px;color:#111">Сайн байна уу, ${params.customerName}!</h3>` +
        '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin-bottom:20px;text-align:center">' +
        '<div style="font-size:36px;margin-bottom:8px">✅</div>' +
        `<div style="font-size:16px;font-weight:700;color:#16a34a">${params.productName}</div>` +
        '<div style="font-size:13px;color:#6b7280;margin-top:4px">Дизайн батлагдаж хэвлэлд орлоо</div>' +
        '</div>' +
        fileHtml +
        '<p style="color:#6b7280;font-size:13px;text-align:center">Хэвлэл дуусмагц хүргэлтийн мэдээлэл ирнэ.</p>' +
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
      subject: 'BizPrint — Таны захиалга замдаа!',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        this.header('linear-gradient(135deg,#FF6B00,#F59E0B)', 'BizPrint — Хүргэлт эхэллээ!') +
        '<div style="padding:28px">' +
        `<h3 style="margin:0 0 12px;color:#111">Сайн байна уу, ${params.customerName}!</h3>` +
        '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px">' +
        `<div style="font-size:15px;font-weight:700;color:${BRAND};text-align:center;margin-bottom:16px">${params.productName} замдаа!</div>` +
        '<table style="width:100%">' +
        '<tr><td style="padding:6px;color:#9a3412;font-size:11px;font-weight:600">ЖОЛООЧ</td><td style="padding:6px;color:#9a3412;font-size:11px;font-weight:600">ХАЯГ</td></tr>' +
        `<tr><td style="padding:6px"><strong>${params.courierName}</strong><br><span style="color:#666;font-size:13px">${params.courierPhone}</span></td>` +
        `<td style="padding:6px;font-size:13px">${params.address}</td></tr>` +
        '</table>' +
        '</div>' +
        `<p style="color:#6b7280;font-size:13px;text-align:center">Асуулт байвал: <strong>${params.courierPhone}</strong></p>` +
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
      subject: 'BizPrint — Захиалга хүргэгдлээ!',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        this.header('linear-gradient(135deg,#10B981,#059669)', 'BizPrint — Хүргэгдлээ!') +
        '<div style="padding:28px;text-align:center">' +
        '<div style="font-size:48px;margin-bottom:16px">🎉</div>' +
        `<h3 style="margin:0 0 8px;color:#111">Сайн байна уу, ${params.customerName}!</h3>` +
        `<p style="color:#6b7280;margin:0 0 24px">${params.productName} амжилттай хүргэгдлээ.</p>` +
        '<a href="http://bizprint.mn/dashboard" style="background:#10B981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Дашбоард харах</a>' +
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
    const fmt = (n: number) => Number(n).toLocaleString('mn-MN')
    await this.mailerService.sendMail({
      to: q.to,
      subject: `BizPrint — ${q.quote_number} — Үнийн санал`,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        this.header('linear-gradient(135deg,#FF6B00,#FF8C42)', 'BizPrint — Үнийн санал') +
        '<div style="padding:32px">' +
        `<h2 style="margin:0 0 8px;color:#111">Сайн байна уу, ${q.name}!</h2>` +
        '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;margin-bottom:24px">' +
        `<div style="font-size:14px;color:${BRAND};font-weight:600;margin-bottom:4px">${q.quote_number}</div>` +
        `<div style="font-size:28px;font-weight:800;color:${BRAND}">${fmt(q.total_price)}₮</div>` +
        `<div style="font-size:13px;color:#6b7280;margin-top:4px">Нэгж үнэ: ${fmt(q.unit_price)}₮/ш · ${q.quantity.toLocaleString()} ширхэг</div>` +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse">' +
        `<tr style="background:#f9fafb"><td style="padding:8px 12px;font-size:13px;color:#6b7280">Бүтээгдэхүүн</td><td style="padding:8px 12px;font-weight:600">${q.product_name}</td></tr>` +
        `<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280">Хэмжээ</td><td style="padding:8px 12px">${q.size || `${q.width_mm}×${q.height_mm}мм`}</td></tr>` +
        `<tr style="background:#f9fafb"><td style="padding:8px 12px;font-size:13px;color:#6b7280">Цаас</td><td style="padding:8px 12px">${q.paper_type} ${q.paper_gsm}г/м²</td></tr>` +
        `<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280">Өнгө / Тал</td><td style="padding:8px 12px">${q.color_mode} · ${q.sides}</td></tr>` +
        '</table>' +
        `<div style="margin-top:16px;font-size:12px;color:#9ca3af">Хүчинтэй хугацаа: ${new Date(q.valid_until).toLocaleDateString('mn-MN')} хүртэл</div>` +
        '<div style="margin-top:20px;text-align:center">' +
        '<a href="http://bizprint.mn/quote" style="background:#FF6B00;color:#fff;padding:11px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Захиалга өгөх</a>' +
        '</div>' +
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
      subject: `BizPrint — ${date} — ${quotes.length} үнийн санал`,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
        `<div style="background:${BRAND};padding:24px;color:#fff"><h2 style="margin:0">BizPrint — Өдрийн тайлан</h2><p style="margin:4px 0 0;opacity:0.85">${date}</p></div>` +
        '<div style="padding:24px">' +
        `<p style="margin:0 0 8px">Нийт санал: <strong>${quotes.length}</strong></p>` +
        `<p style="margin:0">Нийт дүн: <strong style="color:${BRAND};font-size:18px">${fmt(total)}₮</strong></p>` +
        '</div></div>',
    })
  }
}
