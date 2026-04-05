import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrepressAIEngine } from './prepress-ai.engine';
import { PdfInspectorService } from '../pdf-inspector/pdf-inspector.service';

@ApiTags('Prepress')
@Controller('ai/prepress')
export class PrepressController {
  constructor(private readonly pdfInspector: PdfInspectorService) {}

  @Post('check')
  @ApiOperation({ summary: 'Prepress шалгалт (параметрээр)' })
  check(@Body() body: any) {
    return PrepressAIEngine.analyze({
      dpi: body.dpi,
      bleed_mm: body.bleed_mm,
      color_mode: body.color_mode,
      fonts_embedded: body.fonts_embedded,
      page_width_mm: body.page_width_mm,
      page_height_mm: body.page_height_mm,
      has_transparency: body.has_transparency,
      image_count: body.image_count,
      total_fonts: body.total_fonts,
      embedded_fonts: body.embedded_fonts,
    });
  }

  @Post('auto-check')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'PDF файл автомат шалгалт (upload)' })
  async autoCheck(@UploadedFile() file: Express.Multer.File) {
    const inspection = await this.pdfInspector.inspect(file.buffer);

    const preflight = PrepressAIEngine.analyze({
      dpi: inspection.estimated_dpi ?? undefined,
      bleed_mm: inspection.has_bleed_box ? 3 : 0,
      color_mode: inspection.color_spaces?.[0] ?? 'Unknown',
      fonts_embedded: inspection.embedded_fonts === inspection.total_fonts,
      page_width_mm: inspection.page_width_mm,
      page_height_mm: inspection.page_height_mm,
      has_transparency: inspection.checks?.transparency?.status === 'warning',
      image_count: parseInt(inspection.checks?.image_count?.detail) || 0,
      total_fonts: inspection.total_fonts,
      embedded_fonts: inspection.embedded_fonts,
    });

    return {
      inspection,
      preflight,
      combined_score: Math.round((inspection.score + preflight.score) / 2),
      production_ready: preflight.production_ready && inspection.production_ready,
    };
  }
}
