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
    to: string; name: string; phone: string; quote_number: string;
    product_name: string; quantity: number; pages: number; size: string;
    width_mm: number; height_mm: number; paper_type: string; paper_gsm: number;
    color_mode: string; sides: string; finishing: string; binding: string;
    unit_price: number; total_price: number; valid_until: Date; breakdown: any;
    discount_amount?: number; rush_fee?: number; savings_amount?: number;
    urgency?: string; smart_adjustments?: any[];
  }) {
    const fmt = (n: number) => Number(n || 0).toLocaleString('mn-MN')
    const bd = q.breakdown || {}
    const finishingLabels: Record<string, string> = {
      none: 'Байхгүй', laminate_matte: 'Матт ламинат', laminate_gloss: 'Гялгар ламинат',
      soft_touch: 'Soft touch', uv: 'UV лак', fold: 'Нугалах',
    }
    const bindingLabels: Record<string, string> = {
      none: 'Байхгүй', staple: 'Степлер', perfect: 'Төгс холбох',
      spiral: 'Спираль', hardcover: 'Хатуу хавтас',
    }
    const sidesLabel = q.sides === 'double' ? '2 тал' : '1 тал'
    const colorLabel = q.color_mode === 'color' ? 'Өнгөт' : 'Хар цагаан'
    const urgencyLabels: Record<string, string> = {
      rush_24h: '24 цагийн яаралтай', rush_48h: '48 цагийн яаралтай', standard: 'Стандарт',
    }

    const row = (label: string, value: string, bold = false) =>
      '<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">' + label + '</td>' +
      '<td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f3f4f6;text-align:right;' + (bold ? 'font-weight:700;color:#FF6B00' : '') + '">' + value + '</td></tr>'

    const discountHtml = Number(q.savings_amount || 0) > 0
      ? '<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin-bottom:16px;text-align:center">' +
        '<span style="color:#059669;font-weight:700;font-size:14px">Та ' + fmt(q.savings_amount || 0) + '₮ хэмнэлээ!</span></div>'
      : ''

    const rushHtml = Number(q.rush_fee || 0) > 0
      ? row('Яаралтай нэмэгдэл', '+' + fmt(q.rush_fee || 0) + '₮')
      : ''

    const discountRow = Number(q.discount_amount || 0) > 0
      ? row('Хөнгөлөлт', '-' + fmt(q.discount_amount || 0) + '₮')
      : ''

    await this.mailerService.sendMail({
      to: q.to,
      subject: 'BizPrint - ' + q.quote_number + ' - Үнийн санал',
      html:
        '<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#FF6B00,#FF8C42);padding:28px 32px;color:#fff">' +
        '<h1 style="margin:0;font-size:24px">BizPrint</h1>' +
        '<p style="margin:6px 0 0;opacity:0.9;font-size:14px">Үнийн санал</p>' +
        '</div>' +
        '<div style="padding:32px">' +
        '<h2 style="margin:0 0 8px;color:#111">Сайн байна уу, ' + q.name + '!</h2>' +
        '<p style="color:#6b7280;margin:0 0 24px;font-size:14px">Таны хүсэлтийн дагуу үнийн санал бэлдлээ.</p>' +

        '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center">' +
        '<div style="font-size:14px;color:#9a3412;font-weight:600;margin-bottom:4px">' + q.quote_number + '</div>' +
        '<div style="font-size:32px;font-weight:800;color:#FF6B00">' + fmt(q.total_price) + '₮</div>' +
        '<div style="font-size:13px;color:#9a3412;margin-top:4px">Нэгж үнэ: ' + fmt(q.unit_price) + '₮/ш</div>' +
        '</div>' +

        discountHtml +

        '<h3 style="margin:0 0 12px;font-size:15px;color:#111">Захиалгын мэдээлэл</h3>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        row('Бүтээгдэхүүн', q.product_name || '-') +
        row('Тоо ширхэг', q.quantity + ' ш') +
        row('Хэмжээ', q.size + ' (' + q.width_mm + 'x' + q.height_mm + 'мм)') +
        row('Хуудас', (q.pages || 1) + ' хуудас') +
        row('Цаас', (q.paper_gsm || 150) + 'gsm') +
        row('Өнгө', colorLabel) +
        row('Тал', sidesLabel) +
        row('Финиш', finishingLabels[q.finishing] || q.finishing || '-') +
        row('Холбох', bindingLabels[q.binding] || q.binding || '-') +
        (q.urgency ? row('Хугацаа', urgencyLabels[q.urgency] || 'Стандарт') : '') +
        '</table>' +

        '<h3 style="margin:0 0 12px;font-size:15px;color:#111">Зардлын задаргаа</h3>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        row('Цаасны зардал', fmt(bd.paper_cost || 0) + '₮') +
        row('Хэвлэлийн зардал', fmt(bd.print_cost || 0) + '₮') +
        (Number(bd.finishing_cost) > 0 ? row('Финишийн зардал', fmt(bd.finishing_cost) + '₮') : '') +
        (Number(bd.binding_cost) > 0 ? row('Холболтын зардал', fmt(bd.binding_cost) + '₮') : '') +
        (Number(bd.setup_cost) > 0 ? row('Бэлтгэл зардал', fmt(bd.setup_cost) + '₮') : '') +
        discountRow +
        rushHtml +
        row('Нийт дүн', fmt(q.total_price) + '₮', true) +
        '</table>' +

        '<div style="background:#f9fafb;border-radius:8px;padding:14px;text-align:center;font-size:12px;color:#6b7280">' +
        'Үнэ хүчинтэй: ' + (q.valid_until ? new Date(q.valid_until).toLocaleDateString('mn-MN') : '3 хоног') + ' хүртэл' +
        '</div>' +
        '</div></div>',
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