export interface PrepressIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  detail?: string;
}

export interface PrepressResult {
  safe: boolean;
  production_ready: boolean;
  score: number;
  issues: PrepressIssue[];
  summary: string;
}

export class PrepressAIEngine {

  static analyze(input: {
    dpi?: number;
    bleed_mm?: number;
    color_mode?: string;
    fonts_embedded?: boolean;
    page_width_mm?: number;
    page_height_mm?: number;
    has_transparency?: boolean;
    image_count?: number;
    total_fonts?: number;
    embedded_fonts?: number;
  }): PrepressResult {

    const issues: PrepressIssue[] = [];

    // DPI шалгалт
    if (input.dpi && input.dpi < 150) {
      issues.push({ code: 'LOW_DPI', severity: 'error', message: 'Нягтрал маш бага', detail: `${input.dpi} DPI — хамгийн багадаа 300 DPI шаардлагатай` });
    } else if (input.dpi && input.dpi < 250) {
      issues.push({ code: 'LOW_DPI', severity: 'warning', message: 'Нягтрал бага', detail: `${input.dpi} DPI — 300 DPI зөвлөнө` });
    }

    // Bleed шалгалт
    if (input.bleed_mm !== undefined && input.bleed_mm < 3) {
      issues.push({
        code: 'BLEED_TOO_SMALL',
        severity: input.bleed_mm === 0 ? 'error' : 'warning',
        message: input.bleed_mm === 0 ? 'Bleed байхгүй' : 'Bleed хэт бага',
        detail: `${input.bleed_mm}мм — 3мм bleed шаардлагатай`,
      });
    }

    // Өнгөний орон зай
    if (input.color_mode && input.color_mode !== 'CMYK') {
      if (input.color_mode === 'RGB') {
        issues.push({ code: 'COLOR_NOT_CMYK', severity: 'error', message: 'RGB өнгөний орон зай', detail: 'Хэвлэлд CMYK формат шаардлагатай. RGB → CMYK хөрвүүлэх шаардлагатай' });
      } else if (input.color_mode === 'Mixed') {
        issues.push({ code: 'COLOR_MIXED', severity: 'warning', message: 'Холимог өнгөний орон зай', detail: 'RGB + CMYK хольж ашигласан — бүгдийг CMYK болгох зөвлөнө' });
      }
    }

    // Font embedding
    if (input.fonts_embedded === false) {
      issues.push({ code: 'FONTS_NOT_EMBEDDED', severity: 'error', message: 'Фонт embed хийгдээгүй', detail: 'Бүх фонтуудыг embed хийнэ эсвэл outline болгоно' });
    } else if (input.total_fonts && input.embedded_fonts !== undefined && input.embedded_fonts < input.total_fonts) {
      const missing = input.total_fonts - input.embedded_fonts;
      issues.push({ code: 'FONTS_PARTIAL', severity: 'warning', message: `${missing} фонт embed хийгдээгүй`, detail: `${input.total_fonts} фонтоос ${input.embedded_fonts} нь embed хийгдсэн` });
    }

    // Transparency
    if (input.has_transparency) {
      issues.push({ code: 'HAS_TRANSPARENCY', severity: 'warning', message: 'Transparency ашигласан', detail: 'Offset хэвлэлд flatten хийхийг зөвлөнө' });
    }

    // Хэмжээ
    if (input.page_width_mm && input.page_height_mm) {
      if (input.page_width_mm < 10 || input.page_height_mm < 10) {
        issues.push({ code: 'PAGE_TOO_SMALL', severity: 'error', message: 'Хуудас хэт жижиг', detail: `${input.page_width_mm}×${input.page_height_mm}мм` });
      }
      if (input.page_width_mm > 3200 || input.page_height_mm > 5000) {
        issues.push({ code: 'PAGE_TOO_LARGE', severity: 'warning', message: 'Хуудас маш том', detail: `${input.page_width_mm}×${input.page_height_mm}мм — тусгай машин шаардлагатай` });
      }
    }

    // Зураг
    if (input.image_count === 0) {
      issues.push({ code: 'NO_IMAGES', severity: 'info', message: 'Зураг байхгүй', detail: 'Текст эсвэл вектор контент л байна' });
    }

    // Score
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const score = Math.max(0, 100 - errorCount * 25 - warningCount * 10);
    const safe = errorCount === 0;
    const production_ready = errorCount === 0 && warningCount <= 1;

    // Summary
    let summary: string;
    if (production_ready) {
      summary = 'Файл хэвлэлд бэлэн';
    } else if (safe) {
      summary = `${warningCount} анхааруулга байна — шалгаж засахыг зөвлөнө`;
    } else {
      summary = `${errorCount} алдаа олдлоо — засахгүйгээр хэвлэж болохгүй`;
    }

    return { safe, production_ready, score, issues, summary };
  }
}
