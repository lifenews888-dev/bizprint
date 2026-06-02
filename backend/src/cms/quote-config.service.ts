import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteConfig } from './quote-config.entity';

const SEED_CONFIGS = [
  {
    product_type: 'business-card', name_mn: 'Нэрийн хуудас', icon: '💳',
    base_rate: 340, min_qty: 100, sort_order: 1,
    sizes: [
      { label: '90×54мм (стандарт)', w: 90, h: 54 },
      { label: '90×50мм', w: 90, h: 50 },
      { label: 'Захиалгат', w: 0, h: 0 },
    ],
    materials: ['Art card 300gsm', 'Art card 350gsm', 'Металл', 'PVC тунгалаг'],
    materials_mn: ['Арт карт 300гр', 'Арт карт 350гр', 'Металл', 'PVC (тунгалаг)'],
    finishing_options: ['Матт ламинат', 'Глосс ламинат', 'Soft-touch', 'УВ лак', 'Фольг тамга'],
    finishing_options_mn: ['Матт ламинат', 'Гэрэлт ламинат', 'Зөөлөн мэдрэмж (Soft-touch)', 'УВ лак', 'Фольг тамга'],
    volume_discounts: [
      { min_qty: 250, discount_percent: 10 },
      { min_qty: 500, discount_percent: 15 },
      { min_qty: 1000, discount_percent: 25 },
    ],
  },
  {
    product_type: 'flyer', name_mn: 'Флаер', icon: '📄',
    base_rate: 180, min_qty: 50, sort_order: 2,
    sizes: [
      { label: 'A6 (105×148мм)', w: 105, h: 148 },
      { label: 'A5 (148×210мм)', w: 148, h: 210 },
      { label: 'A4 (210×297мм)', w: 210, h: 297 },
      { label: 'DL (99×210мм)', w: 99, h: 210 },
      { label: 'Захиалгат', w: 0, h: 0 },
    ],
    materials: ['Glossy 130gsm', 'Glossy 170gsm', 'Matte 170gsm', 'Art card 250gsm'],
    materials_mn: ['Гялгар 130гр', 'Гялгар 170гр', 'Матт 170гр', 'Арт карт 250гр'],
    finishing_options: ['Матт ламинат', 'Глосс ламинат', 'УВ лак'],
    finishing_options_mn: ['Матт ламинат', 'Гэрэлт ламинат', 'УВ лак'],
    volume_discounts: [
      { min_qty: 250, discount_percent: 10 },
      { min_qty: 500, discount_percent: 15 },
      { min_qty: 1000, discount_percent: 25 },
    ],
  },
  {
    product_type: 'brochure', name_mn: 'Брошур', icon: '📋',
    base_rate: 250, min_qty: 100, sort_order: 3,
    sizes: [
      { label: 'A5 — 2 нугалаа', w: 148, h: 210 },
      { label: 'A4 — 3 нугалаа', w: 210, h: 297 },
      { label: 'A4 — 2 нугалаа', w: 210, h: 297 },
    ],
    materials: ['Glossy 170gsm', 'Matte 170gsm', 'Art card 250gsm'],
    materials_mn: ['Гялгар 170гр', 'Матт 170гр', 'Арт карт 250гр'],
    finishing_options: ['Матт ламинат', 'Глосс ламинат'],
    finishing_options_mn: ['Матт ламинат', 'Гэрэлт ламинат'],
    volume_discounts: [
      { min_qty: 250, discount_percent: 10 },
      { min_qty: 500, discount_percent: 15 },
    ],
  },
  {
    product_type: 'poster', name_mn: 'Постер', icon: '🖼️',
    base_rate: 210, min_qty: 10, sort_order: 4,
    sizes: [
      { label: 'A3 (297×420мм)', w: 297, h: 420 },
      { label: 'A2 (420×594мм)', w: 420, h: 594 },
      { label: 'A1 (594×841мм)', w: 594, h: 841 },
      { label: 'Захиалгат', w: 0, h: 0 },
    ],
    materials: ['Glossy 170gsm', 'Matte 170gsm', 'Art card 250gsm'],
    materials_mn: ['Гялгар 170гр', 'Матт 170гр', 'Арт карт 250гр'],
    finishing_options: ['Матт ламинат', 'Глосс ламинат', 'УВ лак'],
    finishing_options_mn: ['Матт ламинат', 'Гэрэлт ламинат', 'УВ лак'],
    volume_discounts: [
      { min_qty: 100, discount_percent: 10 },
      { min_qty: 500, discount_percent: 20 },
    ],
  },
  {
    product_type: 'sticker', name_mn: 'Стикер', icon: '📎',
    base_rate: 280, min_qty: 100, sort_order: 5,
    sizes: [
      { label: 'Дугуй 50мм', w: 50, h: 50 },
      { label: 'Дугуй 100мм', w: 100, h: 100 },
      { label: 'Дөрвөлжин A6', w: 105, h: 148 },
      { label: 'Захиалгат', w: 0, h: 0 },
    ],
    materials: ['Vinyl цагаан', 'Vinyl тунгалаг', 'Цаасан'],
    materials_mn: ['Виниль (цагаан)', 'Виниль (тунгалаг)', 'Цаасан'],
    finishing_options: ['Ламинат', 'UV coating'],
    finishing_options_mn: ['Ламинат', 'УВ лак'],
    volume_discounts: [
      { min_qty: 500, discount_percent: 10 },
      { min_qty: 1000, discount_percent: 20 },
    ],
  },
  {
    product_type: 'banner', name_mn: 'Баннер', icon: '🏗️',
    base_rate: 1200, min_qty: 1, sort_order: 6,
    sizes: [
      { label: '1×2м', w: 1000, h: 2000 },
      { label: '1×3м', w: 1000, h: 3000 },
      { label: '2×3м', w: 2000, h: 3000 },
      { label: '3×6м', w: 3000, h: 6000 },
      { label: 'Захиалгат', w: 0, h: 0 },
    ],
    materials: ['Vinyl 440gsm', 'Mesh баннер', 'Backlit хулдаас'],
    materials_mn: ['Виниль баннер 440гр', 'Мэш баннер', 'Гэрэлт хулдаас'],
    finishing_options: ['Дантиг гагнуур', 'Оосор нэмэх'],
    finishing_options_mn: ['Гантиг гагнуур', 'Оосор нэмэх'],
    volume_discounts: [],
  },
  {
    product_type: 'book', name_mn: 'Ном / Каталог', icon: '📕',
    base_rate: 170, min_qty: 10, sort_order: 7,
    sizes: [
      { label: 'A5 (148×210мм)', w: 148, h: 210 },
      { label: 'A4 (210×297мм)', w: 210, h: 297 },
      { label: 'Square 200×200мм', w: 200, h: 200 },
    ],
    materials: ['Glossy хавтас', 'Matte хавтас', 'Soft-touch хавтас'],
    materials_mn: ['Гялгар хавтас', 'Матт хавтас', 'Зөөлөн хавтас'],
    finishing_options: ['Perfect bind', 'Saddle stitch', 'Wire-O', 'Хатуу хавтас'],
    finishing_options_mn: ['Нуруугаар наах (Perfect bind)', 'Дунд зүүсэн (Saddle stitch)', 'Утсан нуруу (Wire-O)', 'Хатуу хавтас'],
    volume_discounts: [
      { min_qty: 100, discount_percent: 10 },
      { min_qty: 500, discount_percent: 20 },
    ],
  },
];

@Injectable()
export class QuoteConfigService {
  constructor(
    @InjectRepository(QuoteConfig)
    private repo: Repository<QuoteConfig>,
  ) {}

  async findAll() {
    await this.seedMissingDefaults();
    return this.repo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  findOne(productType: string) {
    return this.repo.findOne({ where: { product_type: productType } });
  }

  async upsert(productType: string, data: Partial<QuoteConfig>) {
    const existing = await this.repo.findOne({ where: { product_type: productType } });
    if (existing) {
      // Strip id and timestamps to avoid overwriting
      const { id, created_at, updated_at, ...updates } = data as any;
      await this.repo.update(existing.id, updates);
      return this.repo.findOne({ where: { product_type: productType } });
    }
    return this.repo.save(this.repo.create({ ...data, product_type: productType }));
  }

  async seed() {
    return this.seedMissingDefaults();
  }

  private async seedMissingDefaults() {
    const existing = await this.repo.find();
    const existingTypes = new Set(existing.map((config) => config.product_type));
    let seeded = 0;
    for (const c of SEED_CONFIGS) {
      if (existingTypes.has(c.product_type)) continue;
      try {
        await this.repo.save(this.repo.create(c as any));
        seeded++;
      } catch {}
    }
    return {
      seeded,
      total_defaults: SEED_CONFIGS.length,
      message: seeded > 0 ? 'Default quote configs seeded' : 'Default quote configs already present',
    };
  }
}
