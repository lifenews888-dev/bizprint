import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from '../products/product.entity';
import { ProductMaster } from '../products-master/entities/product-master.entity';
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
    @InjectRepository(ProductMaster)
    private readonly masterRepo: Repository<ProductMaster>,
  ) {}

  async importFromExcel(buffer: Buffer | ArrayBuffer): Promise<{
    imported: number;
    skipped: number;
    errors: { row: number; sheet: string; message: string }[];
    preview: any[];
  }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);

    const errors: { row: number; sheet: string; message: string }[] = [];
    const preview: any[] = [];
    const toSave: Product[] = [];

    // Get all existing slugs in one query
    const existingSlugs = new Set(
      (await this.productRepo.find({ select: ['slug'] })).map(p => p.slug),
    );
    let skipped = 0;

    this.logger.log(`Workbook loaded. Sheets: ${wb.worksheets.map(s => s.name).join(', ')}. Existing slugs: ${existingSlugs.size}`);

    // Try Unified Import sheet first
    const wsUnified = wb.getWorksheet('Unified Import');
    if (wsUnified) {
      this.logger.log(`Unified Import sheet found: ${wsUnified.rowCount} rows`);
      for (let r = 2; r <= wsUnified.rowCount; r++) {
        try {
          const row = wsUnified.getRow(r);
          const name = this.cellStr(row, 5);
          const slug = this.cellStr(row, 6);
          const productType = this.cellStr(row, 4);
          if (!name || !slug || !productType || slug === '───') continue;
          if (existingSlugs.has(slug)) { skipped++; continue; }
          existingSlugs.add(slug);

          const isActive = this.cellStr(row, 25) === 'active';
          const isSignage = productType === 'signage';

          toSave.push(this.productRepo.create({
            product_type: productType,
            name, name_mn: name, slug,
            category: this.cellStr(row, 10) || '',
            subcategory: this.cellStr(row, 11) || null,
            description: this.cellStr(row, 13) || null,
            base_price: this.cellNum(row, 18) || this.cellNum(row, 20) || 0,
            thumbnail_url: this.cellStr(row, 16) || null,
            is_active: isActive,
            pricing_mode: isSignage ? 'formula' : 'fixed',
            requires_file_upload: false,
            requires_dimensions: isSignage,
            compare_specs: {
              seo_description: this.cellStr(row, 12) || '',
              features_html: this.cellStr(row, 14) || '',
              material: this.cellStr(row, 15) || '',
              image_alt: this.cellStr(row, 17) || '',
              price_excl_vat: String(this.cellNum(row, 19) || ''),
              price_usd: String(this.cellNum(row, 21) || ''),
              unit: this.cellStr(row, 22) || '',
              qty_condition: this.cellStr(row, 23) || '',
              variants: this.cellStr(row, 24) || '',
              top_menu: this.cellStr(row, 7) || '',
              shop_slug: this.cellStr(row, 8) || '',
              shop_category: this.cellStr(row, 9) || '',
              source: this.cellStr(row, 3) || '',
              global_id: this.cellStr(row, 2) || '',
            },
          }));

          if (preview.length < 10) {
            preview.push({ name, category: this.cellStr(row, 10), product_type: productType, price: this.cellNum(row, 18) || this.cellNum(row, 20) || 0, status: isActive ? 'active' : 'draft' });
          }
        } catch (e: any) {
          errors.push({ row: r, sheet: 'Unified Import', message: e.message?.substring(0, 100) });
        }
      }
      // Skip legacy sheets if unified found
    } else {

    // Sheet 1: "Вэб — Vistaprint"
    const ws1 = wb.getWorksheet('Вэб — Vistaprint');
    if (ws1) {
      for (let r = 2; r <= ws1.rowCount; r++) {
        try {
          const row = ws1.getRow(r);
          const name = this.cellStr(row, 2);
          const slug = this.cellStr(row, 3);
          if (!name || !slug) continue;
          if (existingSlugs.has(slug)) { skipped++; continue; }
          existingSlugs.add(slug);

          const topMenuRaw = this.cellStr(row, 16);
          const topMenu = TOP_MENU_MAP[topMenuRaw?.toUpperCase()] || 'offset';
          const isActive = this.cellStr(row, 15) === 'Бэлэн';

          toSave.push(this.productRepo.create({
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
          }));

          if (preview.length < 10) {
            preview.push({ name: name.replace(/Vistaprint/gi, 'BizPrint'), category: this.cellStr(row, 4), product_type: 'shop', price: this.cellNum(row, 11) || 0, status: isActive ? 'active' : 'draft' });
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
          if (existingSlugs.has(slug)) { skipped++; continue; }
          existingSlugs.add(slug);

          const categoryRaw = this.cellStr(row, 4) || '';
          const topMenuRaw = this.cellStr(row, 17) || '';
          const topMenu = TOP_MENU_MAP[topMenuRaw?.toUpperCase()] || 'digital';
          const isSignage = categoryRaw.toLowerCase().includes('sign') || topMenuRaw.toUpperCase().includes('ӨРГӨН');
          const productType = isSignage ? 'signage' : 'print';
          const isActive = this.cellStr(row, 16) === 'Бэлэн';
          const priceExclVat = this.cellNum(row, 12) || 0;
          const priceInclVat = this.cellNum(row, 13) || priceExclVat;

          toSave.push(this.productRepo.create({
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
          }));

          if (preview.length < 10) {
            preview.push({ name: name.replace(/Vistaprint/gi, 'BizPrint'), category: categoryRaw, product_type: productType, price: priceInclVat, status: isActive ? 'active' : 'draft' });
          }
        } catch (e: any) {
          errors.push({ row: r, sheet: 'Вэб — Хэвлэл', message: e.message?.substring(0, 100) });
        }
      }
    }

    } // end else (legacy sheets)

    // Batch save in chunks of 50 — save to BOTH products and product_masters
    let imported = 0;
    const mastersToSave: any[] = [];

    for (const p of toSave) {
      mastersToSave.push(this.masterRepo.create({
        name_mn: p.name_mn,
        name_en: p.name,
        product_type: p.product_type === 'shop' ? 'print' : p.product_type,
        category: p.category,
        subcategory: p.subcategory,
        description: p.description,
        base_price: p.base_price,
        thumbnail_url: p.thumbnail_url,
        is_active: p.is_active,
        pricing_mode: p.pricing_mode,
        code: p.slug,
      }));
    }

    for (let i = 0; i < toSave.length; i += 50) {
      const chunk = toSave.slice(i, i + 50);
      const masterChunk = mastersToSave.slice(i, i + 50);
      try {
        await this.productRepo.save(chunk);
        await this.masterRepo.save(masterChunk);
        imported += chunk.length;
      } catch (e: any) {
        for (let j = 0; j < chunk.length; j++) {
          try {
            await this.productRepo.save(chunk[j]);
            await this.masterRepo.save(masterChunk[j]);
            imported++;
          } catch (e2: any) {
            errors.push({ row: 0, sheet: 'batch', message: `${chunk[j].slug}: ${e2.message?.substring(0, 80)}` });
          }
        }
      }
    }

    this.logger.log(`Import done: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);
    return { imported, skipped, errors, preview };
  }

  async migrateProductsToMasters(): Promise<{ migrated: number; skipped: number; errors: string[] }> {
    const products = await this.productRepo.find();
    const existingCodes = new Set(
      (await this.masterRepo.find({ select: ['code'] })).map(m => m.code),
    );
    let migrated = 0, skipped = 0;
    const errors: string[] = [];
    const batch: any[] = [];

    for (const p of products) {
      if (existingCodes.has(p.slug)) { skipped++; continue; }
      existingCodes.add(p.slug);
      batch.push(this.masterRepo.create({
        name_mn: p.name_mn || p.name,
        name_en: p.name,
        product_type: p.product_type === 'shop' ? 'print' : (p.product_type === 'ready' ? 'print' : p.product_type),
        category: p.category || '',
        subcategory: p.subcategory,
        description: p.description,
        base_price: p.base_price || 0,
        thumbnail_url: p.thumbnail_url,
        images: p.images,
        is_active: p.is_active,
        pricing_mode: p.pricing_mode || 'fixed',
        code: p.slug,
      }));
    }

    for (let i = 0; i < batch.length; i += 50) {
      const chunk = batch.slice(i, i + 50);
      try {
        await this.masterRepo.save(chunk);
        migrated += chunk.length;
      } catch {
        for (const m of chunk) {
          try { await this.masterRepo.save(m); migrated++; }
          catch (e: any) { errors.push(`${m.code}: ${e.message?.substring(0, 60)}`); }
        }
      }
    }

    this.logger.log(`Migration done: ${migrated} migrated, ${skipped} skipped, ${errors.length} errors`);
    return { migrated, skipped, errors };
  }

  async cleanupDemoAndFixImages(): Promise<{ deletedDemo: number; imagesFixed: number; mastersCleaned: number; urlsCleaned?: number }> {
    // 1. Delete demo products (picsum.photos thumbnails)
    const demoProducts = await this.productRepo
      .createQueryBuilder('p')
      .where("p.thumbnail_url LIKE '%picsum.photos%'")
      .getMany();

    const demoSlugs = demoProducts.map(p => p.slug);
    let deletedDemo = 0;
    if (demoProducts.length > 0) {
      await this.productRepo.remove(demoProducts);
      deletedDemo = demoProducts.length;
      // Also delete from product_masters
      if (demoSlugs.length > 0) {
        await this.masterRepo
          .createQueryBuilder()
          .delete()
          .where('code IN (:...codes)', { codes: demoSlugs })
          .execute()
          .catch(() => {});
      }
    }

    // 2. Fix imported products: set images array from thumbnail_url
    const imported = await this.productRepo
      .createQueryBuilder('p')
      .where("p.thumbnail_url IS NOT NULL")
      .andWhere("p.thumbnail_url != ''")
      .andWhere("p.thumbnail_url NOT LIKE '%picsum%'")
      .getMany();

    let imagesFixed = 0;
    for (const p of imported) {
      if (p.thumbnail_url && (!p.images || p.images.length === 0)) {
        p.images = [p.thumbnail_url];
        imagesFixed++;
      }
    }
    if (imagesFixed > 0) {
      await this.productRepo.save(imported.filter(p => p.images?.length > 0));
    }

    // 3. Also update product_masters images
    let mastersCleaned = 0;
    const masters = await this.masterRepo.find();
    for (const m of masters) {
      if (m.thumbnail_url && (!m.images || m.images.length === 0)) {
        m.images = [m.thumbnail_url];
        mastersCleaned++;
      }
    }
    if (mastersCleaned > 0) {
      for (let i = 0; i < masters.length; i += 50) {
        await this.masterRepo.save(masters.slice(i, i + 50));
      }
    }

    // 4. Clear invalid thumbnail URLs (google search, vistaprint pages — not actual images)
    const allProducts = await this.productRepo.find();
    let urlsCleaned = 0;
    for (const p of allProducts) {
      const url = p.thumbnail_url || '';
      const isInvalid = !url || url.includes('google.com/search') || url.includes('vistaprint.com') || (!url.endsWith('.jpg') && !url.endsWith('.png') && !url.endsWith('.webp') && !url.includes('cloudinary') && !url.includes('unsplash') && !url.includes('.jpeg'));
      if (isInvalid && url) {
        p.thumbnail_url = null;
        p.images = null;
        urlsCleaned++;
      }
    }
    if (urlsCleaned > 0) {
      for (let i = 0; i < allProducts.length; i += 50) {
        await this.productRepo.save(allProducts.slice(i, i + 50));
      }
    }

    this.logger.log(`Cleanup: ${deletedDemo} demo deleted, ${imagesFixed} images fixed, ${mastersCleaned} masters updated, ${urlsCleaned} invalid URLs cleared`);
    return { deletedDemo, imagesFixed, mastersCleaned, urlsCleaned };
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
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B00' } };

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
    ws1.addRow({ name: 'Жишээ', slug: 'jishee', category: 'Нэрийн хуудас', subcategory: 'Стандарт', seo: 'SEO', description: 'Тайлбар', features: '<ul><li>Онцлог</li></ul>', image: '', alt: 'Alt', price: 1000, qty: '50+', variants: 'Гялгар', status: 'Бэлэн', top_menu: 'ОФСЕТ ХЭВЛЭЛ', shop_slug: 'business-card', shop_cat: 'Визит карт' });

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
    ws2.addRow({ name: 'Стенд — 160х60', slug: 'stend-160x60', category: 'Өргөн хэвлэл', subcategory: 'Стенд', seo: 'SEO', description: 'Тайлбар', features: '<ul><li>Онцлог</li></ul>', material: 'PVC', image: '', alt: 'Alt', price_excl: 55000, price_incl: 60500, unit: 'ш', qty: '', status: 'Бэлэн', top_menu: 'ӨРГӨН ФОРМАТ', shop_slug: 'banner', shop_cat: 'Баннер' });

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
