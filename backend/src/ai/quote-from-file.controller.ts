import {
  Controller, Post, UseInterceptors, UploadedFile,
  BadRequestException, Body, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PdfInspectorService } from './pdf-inspector/pdf-inspector.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// A-series sizes for detection
const A_SIZES: Record<string, { w: number; h: number }> = {
  A3: { w: 297, h: 420 },
  A4: { w: 210, h: 297 },
  A5: { w: 148, h: 210 },
  A6: { w: 105, h: 148 },
  'Business Card': { w: 90, h: 55 },
};

function detectSize(widthMm: number, heightMm: number): string {
  for (const [name, dims] of Object.entries(A_SIZES)) {
    if (
      (Math.abs(widthMm - dims.w) < 5 && Math.abs(heightMm - dims.h) < 5) ||
      (Math.abs(widthMm - dims.h) < 5 && Math.abs(heightMm - dims.w) < 5)
    ) {
      return name;
    }
  }
  return `Custom (${Math.round(widthMm)}x${Math.round(heightMm)}mm)`;
}

function suggestMaterial(size: string, pages: number): { paper: string; gsm: number; finishing: string } {
  if (size === 'Business Card') return { paper: 'Art card', gsm: 350, finishing: 'Lamination + UV spot' };
  if (pages > 8) return { paper: 'Art paper', gsm: 128, finishing: 'Perfect binding' };
  if (pages > 1) return { paper: 'Art paper', gsm: 150, finishing: 'Staple' };
  return { paper: 'Art paper', gsm: 200, finishing: 'None' };
}

function calculatePrice(size: string, pages: number, quantity: number, gsm: number) {
  // Base price per page based on size
  const sizeMultiplier: Record<string, number> = { A3: 3.5, A4: 2, A5: 1.5, A6: 1, 'Business Card': 0.8 };
  const mult = sizeMultiplier[size] || 2;
  const baseCostPerPage = 50 * mult; // 50₮ base
  const paperCost = baseCostPerPage * (gsm / 100);
  const printCost = paperCost * pages * quantity;

  // Quantity discount
  let discount = 0;
  if (quantity >= 1000) discount = 0.25;
  else if (quantity >= 500) discount = 0.15;
  else if (quantity >= 100) discount = 0.10;

  const vendorCost = printCost * (1 - discount);
  const marginRate = 0.30; // 30% platform margin
  const platformMargin = vendorCost * marginRate;
  const finalPrice = vendorCost + platformMargin;

  return {
    vendor_cost: Math.round(vendorCost),
    platform_margin: Math.round(platformMargin),
    final_price: Math.round(finalPrice),
    unit_price: Math.round(finalPrice / quantity),
    discount_percent: discount * 100,
    breakdown: {
      base_cost_per_page: Math.round(paperCost),
      pages,
      quantity,
      subtotal: Math.round(printCost),
      discount: Math.round(printCost * discount),
      margin_rate: `${marginRate * 100}%`,
    },
  };
}

@Controller('ai')
export class QuoteFromFileController {
  constructor(private pdfInspector: PdfInspectorService) {}

  @Post('quote-from-file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async quoteFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { quantity?: string },
  ) {
    if (!file) throw new BadRequestException('PDF файл шаардлагатай');

    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) throw new BadRequestException('Зөвхөн PDF файл дэмжинэ');

    // Inspect PDF
    let analysis: any = {};
    try {
      analysis = await this.pdfInspector.inspect(file.buffer);
    } catch {
      analysis = { pages: 1, page_width_mm: 210, page_height_mm: 297, score: 0 };
    }

    const widthMm = analysis.page_width_mm || 210;
    const heightMm = analysis.page_height_mm || 297;
    const pages = analysis.pages || 1;
    const quantity = parseInt(body.quantity || '100', 10) || 100;

    // Detect size
    const detectedSize = detectSize(widthMm, heightMm);

    // Suggest material
    const material = suggestMaterial(detectedSize, pages);

    // Calculate price
    const pricing = calculatePrice(detectedSize, pages, quantity, material.gsm);

    // Production simulation
    const productionDays = pages <= 2 ? 2 : pages <= 8 ? 3 : 5;
    const rushDays = Math.max(1, productionDays - 1);

    return {
      file_info: {
        filename: file.originalname,
        size_bytes: file.size,
        pages,
        width_mm: Math.round(widthMm),
        height_mm: Math.round(heightMm),
        detected_size: detectedSize,
        quality_score: analysis.score || null,
      },
      material_suggestion: material,
      pricing: {
        quantity,
        ...pricing,
      },
      production_simulation: {
        standard_days: productionDays,
        rush_days: rushDays,
        rush_surcharge: '30%',
        estimated_delivery: new Date(Date.now() + productionDays * 86400000).toISOString().split('T')[0],
      },
    };
  }
}
