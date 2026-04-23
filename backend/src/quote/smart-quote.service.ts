import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ParsedQuoteData {
  dimensions?: { width: number; height: number; unit: string };
  quantity?: number;
  material?: string;
  price?: { amount: number; currency: string };
  rawText?: string;
  confidence: number;
}

@Injectable()
export class SmartQuoteService {
  private readonly logger = new Logger(SmartQuoteService.name);

  async parsePdf(buffer: Buffer): Promise<ParsedQuoteData> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text || '';
      this.logger.log(`PDF parsed, text length: ${text.length}`);
      return this.extractQuoteData(text);
    } catch (err) {
      this.logger.error('PDF parse error', err);
      return { confidence: 0, rawText: '' };
    }
  }

  extractQuoteData(text: string): ParsedQuoteData {
    const result: ParsedQuoteData = { confidence: 0, rawText: text };

    // Dimensions: e.g. "100x200mm", "50 x 70 cm", "24x36 inch"
    const dimMatch = text.match(/(\d+(?:\.\d+)?)\s*[xXÃ—]\s*(\d+(?:\.\d+)?)\s*(mm|cm|inch|in)\b/);
    if (dimMatch) {
      result.dimensions = {
        width: parseFloat(dimMatch[1]),
        height: parseFloat(dimMatch[2]),
        unit: dimMatch[3],
      };
      result.confidence += 30;
    }

    // Quantity: e.g. "qty: 500", "1000 pcs", "500 copies"
    const qtyMatch = text.match(/(?:qty[:\s]+|quantity[:\s]+|(\d+)\s*(?:pcs|copies|sheets|units))/i);
    if (qtyMatch) {
      const num = text.match(/(?:qty[:\s]+|quantity[:\s]+)(\d+)|(\d+)\s*(?:pcs|copies|sheets|units)/i);
      if (num) {
        result.quantity = parseInt(num[1] || num[2], 10);
        result.confidence += 25;
      }
    }

    // Material keywords
    const materials = [
      'vinyl', 'canvas', 'acrylic', 'banner', 'flex', 'mesh', 'fabric',
      'paper', 'cardstock', 'glossy', 'matte', 'satin', 'foil', 'pvc',
    ];
    for (const mat of materials) {
      if (text.toLowerCase().includes(mat)) {
        result.material = mat;
        result.confidence += 20;
        break;
      }
    }

    // Price: e.g. "$250", "USD 1,500", "â‚® 50,000"
    const priceMatch = text.match(/(?:USD|EUR|GBP|MNT|[$â‚¬Â£â‚®])\s*([\d,]+(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s*(?:USD|EUR|GBP|MNT)/i);
    if (priceMatch) {
      const amount = parseFloat((priceMatch[1] || priceMatch[2]).replace(/,/g, ''));
      const currMatch = text.match(/USD|EUR|GBP|MNT|\$|â‚¬|Â£|â‚®/);
      result.price = { amount, currency: currMatch ? currMatch[0] : 'USD' };
      result.confidence += 25;
    }

    return result;
  }

  parsePdfSummary(data: ParsedQuoteData): string {
    const parts: string[] = [];
    if (data.dimensions) parts.push(`Ð¥ÑÐ¼Ð¶ÑÑ: ${data.dimensions.width}Ã—${data.dimensions.height}${data.dimensions.unit}`);
    if (data.quantity) parts.push(`Ð¢Ð¾Ð¾: ${data.quantity}`);
    if (data.material) parts.push(`ÐœÐ°Ñ‚ÐµÑ€Ð¸Ð°Ð»: ${data.material}`);
    if (data.price) parts.push(`Ò®Ð½Ñ: ${data.price.currency}${data.price.amount}`);
    return parts.length ? parts.join(', ') : 'ÐœÑÐ´ÑÑÐ»ÑÐ» Ð¾Ð»Ð´ÑÐ¾Ð½Ð³Ò¯Ð¹';
  }
}