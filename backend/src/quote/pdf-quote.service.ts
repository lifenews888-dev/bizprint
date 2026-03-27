import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { Quotation } from './entities/quotation.entity';

@Injectable()
export class PdfQuoteService {

  private fmt(n: number): string {
    return Number(n || 0).toLocaleString('en-US');
  }

  async generateQuotePdf(quote: Quotation): Promise<Buffer> {
    const pdf = PDFDocument.create();
    const doc = await pdf;
    const page = doc.addPage([595, 842]); // A4
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const W = 595;
    const ORANGE = rgb(1, 0.42, 0);
    const BLACK = rgb(0.067, 0.067, 0.067);
    const GRAY = rgb(0.47, 0.44, 0.42);
    const LIGHT_BG = rgb(0.976, 0.973, 0.969);
    const WHITE = rgb(1, 1, 1);
    const GREEN = rgb(0.02, 0.59, 0.42);
    const RED = rgb(0.86, 0.15, 0.15);

    let y = 790;

    // ─── Header Bar ──────────────────────────────────────
    page.drawRectangle({ x: 0, y: 792, width: W, height: 50, color: ORANGE });
    page.drawText('BizPrint', { x: 40, y: 807, size: 20, font: helveticaBold, color: WHITE });
    page.drawText('Mongoliin Khevleliin Platform', { x: 40, y: 795, size: 8, font: helvetica, color: rgb(0.9, 0.9, 0.9) });
    page.drawText('QUOTATION', { x: 430, y: 803, size: 16, font: helveticaBold, color: WHITE });

    // ─── Quote Info ──────────────────────────────────────
    y = 760;
    page.drawText(`#${quote.quote_number}`, { x: 40, y, size: 14, font: helveticaBold, color: ORANGE });

    const createdAt = quote.created_at ? new Date(quote.created_at) : new Date();
    const validUntil = quote.valid_until ? new Date(quote.valid_until) : new Date(Date.now() + 3 * 24 * 3600000);
    page.drawText(`Огноо: ${createdAt.toLocaleDateString('en-GB')}`, { x: 400, y, size: 9, font: helvetica, color: GRAY });
    y -= 14;
    page.drawText(`Хүчинтэй: ${validUntil.toLocaleDateString('en-GB')}`, { x: 400, y, size: 9, font: helvetica, color: GRAY });

    // ─── Customer Info ───────────────────────────────────
    y -= 20;
    page.drawRectangle({ x: 30, y: y - 55, width: W - 60, height: 55, color: LIGHT_BG, borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 0.5 });
    y -= 5;
    page.drawText('Захиалагч:', { x: 40, y, size: 8, font: helvetica, color: GRAY });
    y -= 14;
    page.drawText(quote.customer_name || quote.guest_name || '-', { x: 40, y, size: 11, font: helveticaBold, color: BLACK });
    page.drawText(quote.customer_email || quote.guest_email || '', { x: 250, y, size: 9, font: helvetica, color: GRAY });
    y -= 14;
    const phone = quote.customer_phone || quote.guest_phone || '';
    const company = quote.company_name || '';
    if (phone) page.drawText(`Утас: ${phone}`, { x: 40, y, size: 9, font: helvetica, color: GRAY });
    if (company) page.drawText(`Компани: ${company}`, { x: 250, y, size: 9, font: helvetica, color: GRAY });

    // ─── Product Details ─────────────────────────────────
    y -= 35;
    page.drawText('Бүтээгдэхүүний мэдээлэл', { x: 40, y, size: 11, font: helveticaBold, color: BLACK });
    y -= 5;
    page.drawRectangle({ x: 40, y: y - 1, width: 120, height: 2, color: ORANGE });

    y -= 20;
    const details: [string, string][] = [];
    if (quote.product_name) details.push(['Бүтээгдэхүүн', quote.product_name]);
    if (quote.product_type) details.push(['Төрөл', this.translateType(quote.product_type)]);
    if (quote.dimensions) details.push(['Хэмжээ', typeof quote.dimensions === 'string' ? quote.dimensions : JSON.stringify(quote.dimensions)]);
    if (quote.quantity) details.push(['Тоо ширхэг', `${quote.quantity}`]);
    if (quote.size) details.push(['Хэмжээ', quote.size]);
    if (quote.paper_gsm) details.push(['Цаасны GSM', `${quote.paper_gsm}gsm`]);
    if (quote.color_mode) details.push(['Өнгө', quote.color_mode === 'full' || quote.color_mode === 'color' ? 'Бүрэн өнгө' : 'Хар цагаан']);
    if (quote.sides) details.push(['Тал', quote.sides === 'double' ? 'Хоёр тал' : 'Нэг тал']);
    if (quote.finishing) details.push(['Finishing', this.translateFinishing(quote.finishing)]);
    if (quote.urgency || quote.rush_type) details.push(['Хугацаа', this.translateRush(quote.urgency || quote.rush_type || 'standard')]);

    for (const [label, value] of details) {
      page.drawText(label + ':', { x: 50, y, size: 9, font: helvetica, color: GRAY });
      page.drawText(value, { x: 180, y, size: 9, font: helveticaBold, color: BLACK });
      y -= 16;
    }

    // ─── Breakdown Table ─────────────────────────────────
    y -= 15;
    page.drawText('Зардлын задаргаа', { x: 40, y, size: 11, font: helveticaBold, color: BLACK });
    y -= 5;
    page.drawRectangle({ x: 40, y: y - 1, width: 120, height: 2, color: ORANGE });

    y -= 18;
    // Table header
    page.drawRectangle({ x: 40, y: y - 4, width: W - 80, height: 18, color: rgb(0.95, 0.95, 0.95) });
    page.drawText('Зүйл', { x: 50, y, size: 8, font: helveticaBold, color: GRAY });
    page.drawText('Дүн', { x: 480, y, size: 8, font: helveticaBold, color: GRAY });
    y -= 18;

    const breakdownLines: { label: string; amount: number; color?: any }[] = [];
    if (quote.breakdown && Array.isArray(quote.breakdown)) {
      for (const line of quote.breakdown) {
        breakdownLines.push({ label: line.label || '-', amount: Math.round(Number(line.amount || 0)) });
      }
    } else if (quote.base_price) {
      breakdownLines.push({ label: 'Суурь үнэ', amount: Number(quote.base_price) });
      if (Number(quote.discount_amount) > 0) breakdownLines.push({ label: 'Хөнгөлөлт', amount: -Number(quote.discount_amount), color: GREEN });
      if (Number(quote.rush_fee) > 0) breakdownLines.push({ label: 'Яаралтай нэмэлт', amount: Number(quote.rush_fee), color: RED });
    }

    for (const line of breakdownLines) {
      const isNeg = line.amount < 0;
      page.drawText(line.label, { x: 50, y, size: 9, font: helvetica, color: BLACK });
      page.drawText(`${isNeg ? '' : ''}${this.fmt(Math.abs(line.amount))}₮`, {
        x: isNeg ? 465 : 470, y, size: 9,
        font: helveticaBold,
        color: isNeg ? GREEN : (line.color || BLACK),
      });
      y -= 15;
    }

    // ─── Total ───────────────────────────────────────────
    y -= 5;
    page.drawRectangle({ x: 40, y: y - 10, width: W - 80, height: 40, color: rgb(1, 0.97, 0.93), borderColor: ORANGE, borderWidth: 1.5 });
    y -= 2;
    page.drawText('НИЙТ ДҮН', { x: 55, y, size: 10, font: helveticaBold, color: ORANGE });
    page.drawText(`${this.fmt(Number(quote.total_price))}₮`, { x: 410, y: y - 3, size: 22, font: helveticaBold, color: ORANGE });
    y -= 12;
    page.drawText(`Нэгж үнэ: ${this.fmt(Number(quote.unit_price))}₮/ш`, { x: 55, y, size: 8, font: helvetica, color: GRAY });
    page.drawText('НӨАТ ороогүй', { x: 480, y, size: 7, font: helvetica, color: GRAY });

    // ─── Notes ───────────────────────────────────────────
    if (quote.notes) {
      y -= 35;
      page.drawText('Тэмдэглэл:', { x: 40, y, size: 9, font: helveticaBold, color: BLACK });
      y -= 14;
      page.drawText(quote.notes.substring(0, 200), { x: 40, y, size: 8, font: helvetica, color: GRAY, maxWidth: W - 80 });
    }

    // ─── QR Code ─────────────────────────────────────────
    try {
      const qrUrl = `http://localhost:3000/quote?ref=${quote.quote_number}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 80, margin: 1 });
      const qrBase64 = qrDataUrl.split(',')[1];
      const qrImage = await doc.embedPng(Buffer.from(qrBase64, 'base64'));
      page.drawImage(qrImage, { x: W - 120, y: 50, width: 65, height: 65 });
      page.drawText('QR код уншуулж', { x: W - 125, y: 42, size: 6, font: helvetica, color: GRAY });
      page.drawText('дэлгэрэнгүй харах', { x: W - 123, y: 34, size: 6, font: helvetica, color: GRAY });
    } catch { /* QR generation failed, skip */ }

    // ─── Footer ──────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width: W, height: 28, color: rgb(0.96, 0.96, 0.96) });
    page.drawText('BizPrint — Mongoliin Khevleliin Platform', { x: 40, y: 10, size: 7, font: helvetica, color: GRAY });
    page.drawText('bizprintpro@gmail.com | +976 XXXX XXXX', { x: 340, y: 10, size: 7, font: helvetica, color: GRAY });

    // ─── Terms ───────────────────────────────────────────
    y = 82;
    page.drawText('Нөхцөл:', { x: 40, y, size: 8, font: helveticaBold, color: GRAY });
    y -= 12;
    page.drawText('• Энэхүү үнийн санал 3 хоногийн хүчинтэй.', { x: 45, y, size: 7, font: helvetica, color: GRAY });
    y -= 10;
    page.drawText('• Хэвлэх файл хүлээн авсны дараа үйлдвэрлэл эхэлнэ.', { x: 45, y, size: 7, font: helvetica, color: GRAY });
    y -= 10;
    page.drawText('• Тоо хэмжээ, материалын өөрчлөлт үнэд нөлөөлж болно.', { x: 45, y, size: 7, font: helvetica, color: GRAY });

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }

  private translateType(type: string): string {
    const map: Record<string, string> = {
      'sign': 'Хаяг реклам', 'offset': 'Офсет хэвлэл', 'wide': 'Өргөн хэвлэл',
      'digital': 'Дижитал хэвлэл', 'brochure': 'Брошур', 'poster': 'Постер',
      'business_card': 'Нэрийн хуудас', 'banner': 'Баннер',
    };
    return map[type] || type;
  }

  private translateFinishing(f: string): string {
    const map: Record<string, string> = {
      'none': 'Байхгүй', 'laminate_matte': 'Мат ламинат', 'laminate_gloss': 'Гялгар ламинат',
      'soft_touch': 'Soft touch', 'uv': 'UV лак', 'fold': 'Нугалалт', 'mat': 'Мат',
    };
    return map[f] || f;
  }

  private translateRush(r: string): string {
    const map: Record<string, string> = {
      'standard': 'Энгийн', 'rush_24h': '24 цаг (яаралтай)', 'rush_48h': '48 цаг',
      'rush_72h': '72 цаг', 'normal': 'Энгийн',
    };
    return map[r] || r;
  }
}
