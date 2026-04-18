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
  }) {
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
    to: string; name: string; phone: string; quote_number: string;
    product_name: string; quantity: number; pages: number; size: string;
    width_mm: number; height_mm: number; paper_type: string; paper_gsm: number;
    color_mode: string; sides: string; finishing: string; binding: string;
    unit_price: number; total_price: number; valid_until: Date; breakdown: any;
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
