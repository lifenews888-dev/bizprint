import {
  Controller, Post, Get, Query, Res,
  UseInterceptors, UploadedFile, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExcelProductsService } from './excel-products.service';

@Controller('excel')
export class ExcelProductsController {
  constructor(private readonly svc: ExcelProductsService) {}

  @Post('import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.includes('spreadsheet') || file.originalname.endsWith('.xlsx')) {
        cb(null, true);
      } else {
        cb(new Error('Зөвхөн .xlsx файл зөвшөөрнө'), false);
      }
    },
  }))
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { imported: 0, skipped: 0, errors: [{ row: 0, sheet: '-', message: 'Файл байхгүй' }], preview: [] };
    console.log(`[Excel Import] File received: ${file.originalname}, size: ${file.size}, mime: ${file.mimetype}`);
    try {
      const result = await this.svc.importFromExcel(file.buffer);
      console.log(`[Excel Import] Done: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`);
      return result;
    } catch (e: any) {
      console.error('[Excel Import] Error:', e.message);
      return { imported: 0, skipped: 0, errors: [{ row: 0, sheet: '-', message: e.message }], preview: [] };
    }
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  async exportExcel(
    @Query('productType') productType: string,
    @Query('topMenu') topMenu: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const buf = await this.svc.exportToExcel({ productType, topMenu, status });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="bizprint-products-${Date.now()}.xlsx"`,
    });
    res.send(buf);
  }

  @Get('migrate-to-masters')
  @UseGuards(JwtAuthGuard)
  async migrateToMasters() {
    return this.svc.migrateProductsToMasters();
  }

  @Get('template')
  async downloadTemplate(@Res() res: Response) {
    const buf = await this.svc.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="bizprint-template.xlsx"',
    });
    res.send(buf);
  }
}
