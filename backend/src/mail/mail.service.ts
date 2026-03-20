import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  private fmt(n: number) {
    return Number(n).toLocaleString('mn-MN')
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
      subject: 'BizPrint - Zakhialgaa batalgaajlaa - ' + params.invoiceCode,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
        '<div style="background:#FF6B00;padding:24px;color:#fff"><h2 style="margin:0">BizPrint</h2></div>' +
        '<div style="padding:28px">' +
        '<h3>Sain baina uu, ' + params.name + '!</h3>' +
        '<p>Tanii zakhialgaa <strong>' + params.invoiceCode + '</strong> amjilttai batalgaajlaa.</p>' +
        '<table style="width:100%;border-collapse:collapse">' +
        '<tr><td style="padding:8px;color:#666">Buteegedkheen</td><td style="padding:8px">' + params.productName + '</td></tr>' +
        '<tr><td style="padding:8px;color:#666">Too</td><td style="padding:8px">' + params.quantity + '</td></tr>' +
        '<tr><td style="padding:8px;color:#666;font-weight:700">Niit</td><td style="padding:8px;color:#FF6B00;font-weight:700">' + this.fmt(params.total) + 'T</td></tr>' +
        '</table>' +
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
    urgency?: string; extras?: any; company_name?: string;
  }) {
    const fmt = (n: number) => Number(n || 0).toLocaleString('mn-MN')
    const bd = q.breakdown || {}

    const row = (label: string, value: string, style = '') =>
      '<tr><td style="padding:10px 14px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">' + label + '</td>' +
      '<td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #f3f4f6;text-align:right;' + style + '">' + value + '</td></tr>'

    // Extras row
    let extrasTotal = 0
    if (q.extras && Array.isArray(q.extras)) {
      extrasTotal = q.extras.reduce((s: number, e: any) => s + Number(e.price || 0), 0)
    } else if (q.extras && typeof q.extras === 'object') {
      extrasTotal = Number(q.extras.total || 0)
    }

    const discountRow = Number(q.discount_amount || 0) > 0
      ? row('Хөнгөлөлт', '-' + fmt(q.discount_amount || 0) + '₮', 'color:#059669;font-weight:600')
      : ''

    const rushRow = Number(q.rush_fee || 0) > 0
      ? row('Яаралтай нэмэгдэл', '+' + fmt(q.rush_fee || 0) + '₮')
      : ''

    const extrasRow = extrasTotal > 0
      ? row('Нэмэлт', '+' + fmt(extrasTotal) + '₮')
      : ''

    const validDate = q.valid_until
      ? new Date(q.valid_until).toLocaleDateString('mn-MN')
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('mn-MN')

    await this.mailerService.sendMail({
      to: q.to,
      subject: 'BizPrint - ' + q.quote_number + ' - Үнийн санал',
      html:
        '<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +

        // Header
        '<div style="background:linear-gradient(135deg,#FF6B00,#FF8C42);padding:28px 32px;color:#fff">' +
        '<h1 style="margin:0;font-size:26px;letter-spacing:-0.5px">BizPrint</h1>' +
        '<p style="margin:6px 0 0;opacity:0.9;font-size:14px">Үнийн санал</p>' +
        '</div>' +

        '<div style="padding:32px">' +

        // Greeting
        '<h2 style="margin:0 0 8px;color:#111;font-size:20px">Сайн байна уу, ' + q.name + '!</h2>' +
        '<p style="color:#6b7280;margin:0 0 24px;font-size:14px">Таны хүсэлтийн дагуу үнийн санал бэлдлээ.</p>' +

        // Quote number + total box
        '<div style="background:#fff7ed;border:2px solid #FF6B00;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center">' +
        '<div style="font-size:14px;color:#9a3412;font-weight:600;margin-bottom:4px">' + q.quote_number + '</div>' +
        '<div style="font-size:36px;font-weight:800;color:#FF6B00">' + fmt(q.total_price) + '₮</div>' +
        '</div>' +

        // Product info table
        '<h3 style="margin:0 0 12px;font-size:15px;color:#111">Бүтээгдэхүүний мэдээлэл</h3>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">' +
        '<thead><tr style="background:#f9fafb">' +
        '<th style="padding:10px 14px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb">Бүтээгдэхүүн</th>' +
        '<th style="padding:10px 14px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb">Хэмжээ/тоо</th>' +
        '<th style="padding:10px 14px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb">Нэгж үнэ</th>' +
        '</tr></thead>' +
        '<tbody><tr>' +
        '<td style="padding:12px 14px;font-size:14px;font-weight:600;color:#111;border-bottom:1px solid #f3f4f6">' + (q.product_name || '-') + '</td>' +
        '<td style="padding:12px 14px;font-size:14px;text-align:center;color:#374151;border-bottom:1px solid #f3f4f6">' + q.quantity + ' ш</td>' +
        '<td style="padding:12px 14px;font-size:14px;text-align:right;color:#374151;border-bottom:1px solid #f3f4f6">' + fmt(q.unit_price) + '₮</td>' +
        '</tr></tbody>' +
        '</table>' +

        // Cost breakdown
        '<h3 style="margin:0 0 12px;font-size:15px;color:#111">Зардлын задаргаа</h3>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">' +
        row('Суурь үнэ', fmt(
          (Number(bd.paper_cost || 0) + Number(bd.print_cost || 0) + Number(bd.finishing_cost || 0) + Number(bd.binding_cost || 0) + Number(bd.setup_cost || 0)) || q.unit_price * q.quantity
        ) + '₮') +
        discountRow +
        rushRow +
        extrasRow +
        '<tr><td style="padding:12px 14px;font-weight:700;font-size:15px;color:#111;border-top:2px solid #e5e7eb">Нийт</td>' +
        '<td style="padding:12px 14px;font-weight:800;font-size:20px;color:#FF6B00;text-align:right;border-top:2px solid #e5e7eb">' + fmt(q.total_price) + '₮</td></tr>' +
        '</table>' +

        // Validity
        '<div style="background:#f9fafb;border-radius:8px;padding:14px;text-align:center;font-size:13px;color:#6b7280;margin-bottom:8px">' +
        'Үнэ хүчинтэй: <strong>' + validDate + '</strong> хүртэл (3 хоног)' +
        '</div>' +

        // VAT notice
        '<div style="text-align:center;font-size:12px;color:#9ca3af;margin-bottom:24px">НӨАТ ороогүй</div>' +

        // CTA button
        '<div style="text-align:center;margin-bottom:24px">' +
        '<a href="http://localhost:3000/dashboard" style="display:inline-block;background:#10B981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">' +
        'Захиалга өгөх →</a>' +
        '</div>' +

        '</div>' +

        // Footer
        '<div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">' +
        '<p style="margin:0;font-size:12px;color:#9ca3af">BizPrint — Хэвлэлийн платформ</p>' +
        '</div>' +
        '</div>',
    })
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
}