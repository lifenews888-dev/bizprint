import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import * as ExcelJS from 'exceljs';

const TOP_MENU_MAP: Record<string, string> = {
  'ОФСЕТ ХЭВЛЭЛ': 'offset',
  'ДИЖИТАЛ ХЭВЛЭЛ': 'digital',
  'ӨРГӨН ФОРМАТ': 'wide-format',
  'ПРОМО': 'promo',
};

@Injectable()
export class ExcelProductsService {
  private readonly logger = new Logger(ExcelProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async importFromExcel(buffer: Buffer | ArrayBuffer): Promise<{
    imported: number;
    skipped: number;
    errors: { row: number; sheet: string; message: string }[];
    preview: any[];
  }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);

    let imported = 0;
    let skipped = 0;
    const errors: { row: number; sheet: string; message: string }[] = [];
    const preview: any[] = [];

    this.logger.log(`Workbook loaded. Sheets: ${wb.worksheets.map(s => s.name).join(', ')}`);

    // Sheet 1: "Вэб — Vistaprint"
    const ws1 = wb.getWorksheet('Вэб — Vistaprint');
    this.logger.log(`Sheet1 found: ${!!ws1}, rows: ${ws1?.rowCount || 0}`);
    if (ws1) {
      for (let r = 2; r <= ws1.rowCount; r++) {
        try {
          const row = ws1.getRow(r);
          const name = this.cellStr(row, 2);
          const slug = this.cellStr(row, 3);
          if (!name || !slug) continue;

          const exists = await this.productRepo.findOne({ where: { slug } });
          if (exists) { skipped++; continue; }

          const topMenuRaw = this.cellStr(row, 16);
          const topMenu = TOP_MENU_MAP[topMenuRaw?.toUpperCase()] || 'offset';
          const statusRaw = this.cellStr(row, 15);
          const isActive = statusRaw === 'Бэлэн';

          const product = this.productRepo.create({
            product_type: 'shop',
            name: name.replace(/Vistaprint/gi, 'BizPrint'),
            name_mn: name.replace(/Vistaprint/gi, 'BizPrint'),
            slug,
            category: this.cellStr(row, 4) || '',
            subcategory: this.cellStr(row, 5) || null,
            description: this.cellStr(row, 7)?.replace(/Vistaprint/gi, 'BizPrint') || null,
            base_price: this.cellNum(row, 11) || 0,
            thumbnail_url: this.cellStr(row, 9) || null,
            is_active: isActive,
            pricing_mode: 'fixed',
            requires_file_upload: false,
            compare_specs: {
              seo_description: this.cellStr(row, 6) || '',
              features_html: this.cellStr(row, 8) || '',
              image_alt: this.cellStr(row, 10) || '',
              price_usd: String(this.cellNum(row, 12) || ''),
              qty_condition: this.cellStr(row, 13) || '',
              variants: this.cellStr(row, 14) || '',
              top_menu: topMenu,
              shop_slug: this.cellStr(row, 17) || '',
              shop_category: this.cellStr(row, 18) || '',
            },
          });

          await this.productRepo.save(product);
          imported++;
          if (preview.length < 10) {
            preview.push({ name: product.name, category: product.category, product_type: product.product_type, price: product.base_price, status: isActive ? 'active' : 'draft' });
          }
        } catch (e: any) {
          errors.push({ row: r, sheet: 'Вэб — Vistaprint', message: e.message?.substring(0, 100) });
        }
      }
    }

    // Sheet 2: "Вэб — Хэвлэл"
    const ws2 = wb.getWorksheet('Вэб — Хэвлэл');
    if (ws2) {
      for (let r = 2; r <= ws2.rowCount; r++) {
        try {
          const row = ws2.getRow(r);
          const name = this.cellStr(row, 2);
          const slug = this.cellStr(row, 3);
          if (!name || !slug) continue;

          const exists = await this.productRepo.findOne({ where: { slug } });
          if (exists) { skipped++; continue; }

          const categoryRaw = this.cellStr(row, 4) || '';
          const topMenuRaw = this.cellStr(row, 17) || '';
          const topMenu = TOP_MENU_MAP[topMenuRaw?.toUpperCase()] || 'digital';

          const isSignage = categoryRaw.toLowerCase().includes('sign') ||
            topMenuRaw.toUpperCase().includes('ӨРГӨН');
          const productType = isSignage ? 'signage' : 'print';
          const statusRaw = this.cellStr(row, 16);
          const isActive = statusRaw === 'Бэлэн';

          const priceExclVat = this.cellNum(row, 12) || 0;
          const priceInclVat = this.cellNum(row, 13) || priceExclVat;

          const product = this.productRepo.create({
            product_type: productType,
            name: name.replace(/Vistaprint/gi, 'BizPrint'),
            name_mn: name.replace(/Vistaprint/gi, 'BizPrint'),
            slug,
            category: categoryRaw,
            subcategory: this.cellStr(row, 5) || null,
            description: this.cellStr(row, 7)?.replace(/Vistaprint/gi, 'BizPrint') || null,
            base_price: priceInclVat,
            thumbnail_url: this.cellStr(row, 10) || null,
            is_active: isActive,
            pricing_mode: isSignage ? 'formula' : 'fixed',
            requires_file_upload: false,
            requires_dimensions: isSignage,
            compare_specs: {
              seo_description: this.cellStr(row, 6) || '',
              features_html: this.cellStr(row, 8) || '',
              material: this.cellStr(row, 9) || '',
              image_alt: this.cellStr(row, 11) || '',
              price_excl_vat: String(priceExclVat),
              unit: this.cellStr(row, 14) || '',
              qty_condition: this.cellStr(row, 15) || '',
              top_menu: topMenu,
              shop_slug: this.cellStr(row, 18) || '',
              shop_category: this.cellStr(row, 19) || '',
            },
          });

          await this.productRepo.save(product);
          imported++;
          if (preview.length < 10) {
            preview.push({ name: product.name, category: product.category, product_type: product.product_type, price: product.base_price, status: isActive ? 'active' : 'draft' });
          }
        } catch (e: any) {
          errors.push({ row: r, sheet: 'Вэб — Хэвлэл', message: e.message?.substring(0, 100) });
        }
      }
    }

    this.logger.log(`Import done: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);
    return { imported, skipped, errors, preview };
  }

  async exportToExcel(filters: { productType?: string; topMenu?: string; status?: string }): Promise<Buffer> {
    const qb = this.productRepo.createQueryBuilder('p');
    if (filters.productType) qb.andWhere('p.product_type = :pt', { pt: filters.productType });
    if (filters.status === 'active') qb.andWhere('p.is_active = true');
    if (filters.status === 'draft') qb.andWhere('p.is_active = false');
    if (filters.topMenu) qb.andWhere("p.compare_specs->>'top_menu' = :tm", { tm: filters.topMenu });
    qb.orderBy('p.created_at', 'DESC');

    const products = await qb.getMany();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Бүтээгдэхүүн');

    ws.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Нэр', key: 'name', width: 30 },
      { header: 'Slug', key: 'slug', width: 25 },
      { header: 'Ангилал', key: 'category', width: 20 },
      { header: 'Дэд ангилал', key: 'subcategory', width: 20 },
      { header: 'Тайлбар', key: 'description', width: 40 },
      { header: 'Үнэ (₮)', key: 'base_price', width: 15 },
      { header: 'Төрөл', key: 'product_type', width: 12 },
      { header: 'Статус', key: 'status', width: 10 },
      { header: 'Зураг', key: 'thumbnail_url', width: 30 },
    ];

    // Style header
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B00' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

    for (const p of products) {
      ws.addRow({
        id: p.id?.substring(0, 8),
        name: p.name_mn || p.name,
        slug: p.slug,
        category: p.category,
        subcategory: p.subcategory || '',
        description: p.description?.substring(0, 100) || '',
        base_price: Number(p.base_price),
        product_type: p.product_type,
        status: p.is_active ? 'Бэлэн' : 'Ноорог',
        thumbnail_url: p.thumbnail_url || '',
      });
    }

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async generateTemplate(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();

    // Sheet 1: Shop products
    const ws1 = wb.addWorksheet('Дэлгүүр (Shop)');
    ws1.columns = [
      { header: 'Бүтээгдэхүүний нэр', key: 'name', width: 30 },
      { header: 'URL Slug', key: 'slug', width: 25 },
      { header: 'Ангилал', key: 'category', width: 20 },
      { header: 'Дэд ангилал', key: 'subcategory', width: 20 },
      { header: 'SEO Тайлбар', key: 'seo', width: 30 },
      { header: 'Тайлбар', key: 'description', width: 40 },
      { header: 'Онцлог (HTML)', key: 'features', width: 30 },
      { header: 'Зургийн URL', key: 'image', width: 30 },
      { header: 'Зургийн Alt', key: 'alt', width: 20 },
      { header: 'Үнэ (MNT)', key: 'price', width: 15 },
      { header: 'Тоо ширхэг нөхцөл', key: 'qty', width: 20 },
      { header: 'Хувилбарууд', key: 'variants', width: 20 },
      { header: 'Статус', key: 'status', width: 10 },
      { header: 'Дээд цэс', key: 'top_menu', width: 15 },
      { header: 'Shop Slug', key: 'shop_slug', width: 15 },
      { header: 'Shop Ангилал', key: 'shop_cat', width: 15 },
    ];
    ws1.getRow(1).font = { bold: true };
    ws1.addRow({ name: 'Жишээ бүтээгдэхүүн', slug: 'jishee-product', category: 'Нэрийн хуудас', subcategory: 'Стандарт', seo: 'SEO тайлбар', description: 'Тайлбар', features: '<ul><li>Онцлог</li></ul>', image: '', alt: 'Alt text', price: 1000, qty: '50-с дээш', variants: 'Гялгар / Матт', status: 'Бэлэн', top_menu: 'ОФСЕТ ХЭВЛЭЛ', shop_slug: 'business-card', shop_cat: 'Визит карт' });

    // Sheet 2: Print products
    const ws2 = wb.addWorksheet('Хэвлэмэл (Print)');
    ws2.columns = [
      { header: 'Бүтээгдэхүүний нэр', key: 'name', width: 30 },
      { header: 'URL Slug', key: 'slug', width: 25 },
      { header: 'Ангилал', key: 'category', width: 20 },
      { header: 'Дэд ангилал', key: 'subcategory', width: 20 },
      { header: 'SEO Тайлбар', key: 'seo', width: 30 },
      { header: 'Тайлбар', key: 'description', width: 40 },
      { header: 'Онцлог (HTML)', key: 'features', width: 30 },
      { header: 'Материал', key: 'material', width: 20 },
      { header: 'Зургийн URL', key: 'image', width: 30 },
      { header: 'Зургийн Alt', key: 'alt', width: 20 },
      { header: 'НӨАТгүй үнэ (₮)', key: 'price_excl', width: 15 },
      { header: 'НӨАТтай үнэ (₮)', key: 'price_incl', width: 15 },
      { header: 'Хэмжих нэгж', key: 'unit', width: 12 },
      { header: 'Нөхцөл', key: 'qty', width: 20 },
      { header: 'Статус', key: 'status', width: 10 },
      { header: 'Дээд цэс', key: 'top_menu', width: 15 },
      { header: 'Shop Slug', key: 'shop_slug', width: 15 },
      { header: 'Shop Ангилал', key: 'shop_cat', width: 15 },
    ];
    ws2.getRow(1).font = { bold: true };
    ws2.addRow({ name: 'Стенд — 160х60', slug: 'stend-160x60', category: 'Өргөн хэвлэл', subcategory: 'Стенд', seo: 'SEO тайлбар', description: 'Тайлбар', features: '<ul><li>Онцлог</li></ul>', material: 'PVC', image: '', alt: 'Alt text', price_excl: 55000, price_incl: 60500, unit: 'ш', qty: '', status: 'Бэлэн', top_menu: 'ӨРГӨН ФОРМАТ', shop_slug: 'banner', shop_cat: 'Баннер' });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  private cellStr(row: ExcelJS.Row, col: number): string | null {
    const cell = row.getCell(col);
    if (!cell.value) return null;
    if (typeof cell.value === 'object' && 'text' in cell.value) return String(cell.value.text);
    return String(cell.value);
  }

  private cellNum(row: ExcelJS.Row, col: number): number | null {
    const cell = row.getCell(col);
    if (!cell.value) return null;
    const v = typeof cell.value === 'object' && 'result' in cell.value ? cell.value.result : cell.value;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }
}
