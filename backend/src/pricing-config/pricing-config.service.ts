import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingConfig } from './pricing-config.entity';

@Injectable()
export class PricingConfigService implements OnModuleInit {
  private cache: Map<string, number> = new Map();
  private cacheTime = 0;

  constructor(
    @InjectRepository(PricingConfig)
    private repo: Repository<PricingConfig>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async getAll(): Promise<PricingConfig[]> {
    return this.repo.find({ order: { category: 'ASC', key: 'ASC' } });
  }

  async getByCategory(category: string): Promise<PricingConfig[]> {
    return this.repo.find({
      where: { category },
      order: { key: 'ASC' },
    });
  }

  async getPublic(): Promise<Record<string, number>> {
    const all = await this.repo.find();
    const result: Record<string, number> = {};
    for (const item of all) {
      result[item.key] = Number(item.value);
    }
    return result;
  }

  async get(key: string): Promise<number> {
    const now = Date.now();
    if (this.cache.has(key) && now - this.cacheTime < 30000) {
      return this.cache.get(key)!;
    }

    const all = await this.repo.find();
    this.cache.clear();
    for (const item of all) {
      this.cache.set(item.key, Number(item.value));
    }
    this.cacheTime = now;

    return this.cache.get(key) ?? 0;
  }

  async set(key: string, value: number, updatedBy?: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      if (updatedBy) existing.updated_by = updatedBy;
      await this.repo.save(existing);
    } else {
      await this.repo.save(this.repo.create({ key, value, updated_by: updatedBy }));
    }
    this.cache.clear();
    this.cacheTime = 0;
  }

  async bulkSet(items: { key: string; value: number }[], updatedBy?: string): Promise<void> {
    for (const item of items) {
      await this.set(item.key, item.value, updatedBy);
    }
    this.cache.clear();
    this.cacheTime = 0;
  }

  async seedDefaults(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return;

    const defaults = [
      // Товгор үсэг
      { key: 'tovgor_20cm', value: 35000, label: 'Товгор 20см', category: 'hadag' },
      { key: 'tovgor_30cm', value: 45000, label: 'Товгор 30см', category: 'hadag' },
      { key: 'tovgor_40cm', value: 60000, label: 'Товгор 40см', category: 'hadag' },
      { key: 'tovgor_50cm', value: 75000, label: 'Товгор 50см', category: 'hadag' },
      { key: 'tovgor_60cm', value: 95000, label: 'Товгор 60см', category: 'hadag' },
      { key: 'tovgor_70cm', value: 140000, label: 'Товгор 70см', category: 'hadag' },
      { key: 'tovgor_80cm', value: 180000, label: 'Товгор 80см', category: 'hadag' },
      { key: 'tovgor_90cm', value: 235000, label: 'Товгор 90см', category: 'hadag' },
      { key: 'tovgor_100cm', value: 290000, label: 'Товгор 100см', category: 'hadag' },
      { key: 'tovgor_110cm', value: 330000, label: 'Товгор 110см', category: 'hadag' },
      { key: 'tovgor_120cm', value: 360000, label: 'Товгор 120см', category: 'hadag' },
      { key: 'tovgor_m2', value: 280000, label: 'Товгор м²', category: 'hadag' },
      // Нерж
      { key: 'nerj_off_m2', value: 850000, label: 'Нерж асдаггүй м²', category: 'hadag' },
      { key: 'nerj_on_m2', value: 1300000, label: 'Нерж LED м²', category: 'hadag' },
      // 3D
      { key: 'd3_off_m2', value: 850000, label: '3D гэрэлгүй м²', category: 'hadag' },
      { key: 'd3_on_m2', value: 1250000, label: '3D LED м²', category: 'hadag' },
      // PVC, Epoxy
      { key: 'pvc_m2', value: 280000, label: 'PVC үсэг м²', category: 'hadag' },
      { key: 'epoxy_m2', value: 650000, label: 'Хөнгөн цагаан/Эпокси м²', category: 'hadag' },
      // Самбар
      { key: 'sb_in4_m2', value: 280000, label: 'Самбар дотор 4см м²', category: 'hadag' },
      { key: 'sb_in6_m2', value: 320000, label: 'Самбар дотор 6см м²', category: 'hadag' },
      { key: 'sb_in8_m2', value: 350000, label: 'Самбар дотор 8см м²', category: 'hadag' },
      { key: 'sb_out_corner_m2', value: 380000, label: 'Самбар гадна булантай м²', category: 'hadag' },
      { key: 'sb_out_fold_m2', value: 450000, label: 'Самбар гадна сөхдөг м²', category: 'hadag' },
      // Extras
      { key: 'tmr_ram_m', value: 6500, label: 'Төмөр рам м', category: 'extra' },
      { key: 'extra_rele', value: 30000, label: 'Цагийн реле', category: 'extra' },
      { key: 'extra_tog', value: 35000, label: 'Тог бууруулагч', category: 'extra' },
      { key: 'extra_crane1', value: 200000, label: 'Кран 1цаг', category: 'extra' },
      { key: 'extra_crane8', value: 600000, label: 'Кран 8цаг', category: 'extra' },
      // Rush
      { key: 'rush_48h', value: 0.15, label: '48ц яаралтай %', category: 'rush' },
      { key: 'rush_24h', value: 0.30, label: '24ц яаралтай %', category: 'rush' },
      // Margin
      { key: 'b2b_margin', value: 0.20, label: 'B2B margin', category: 'margin' },
      { key: 'retail_margin', value: 0.45, label: 'Retail margin', category: 'margin' },
      // Хэвлэл
      { key: 'paper_80gsm', value: 60, label: '80gsm цаас', category: 'khevlel' },
      { key: 'paper_120gsm', value: 90, label: '120gsm цаас', category: 'khevlel' },
      { key: 'paper_150gsm', value: 120, label: '150gsm цаас', category: 'khevlel' },
      { key: 'paper_200gsm', value: 160, label: '200gsm цаас', category: 'khevlel' },
      { key: 'paper_300gsm', value: 220, label: '300gsm цаас', category: 'khevlel' },
      { key: 'finish_mat', value: 15, label: 'Мат финиш', category: 'khevlel' },
      { key: 'finish_gloss', value: 12, label: 'Гянт финиш', category: 'khevlel' },
      { key: 'finish_uv', value: 20, label: 'UV финиш', category: 'khevlel' },
      { key: 'finish_soft', value: 25, label: 'Soft touch финиш', category: 'khevlel' },
      { key: 'setup_color', value: 30000, label: 'Өнгөт setup', category: 'khevlel' },
      { key: 'setup_bw', value: 15000, label: 'ХЦ setup', category: 'khevlel' },
      // Discount
      { key: 'disc_100', value: 0.05, label: '100+ хөнгөлөлт', category: 'discount' },
      { key: 'disc_500', value: 0.10, label: '500+ хөнгөлөлт', category: 'discount' },
      { key: 'disc_1000', value: 0.15, label: '1000+ хөнгөлөлт', category: 'discount' },
      { key: 'disc_5000', value: 0.20, label: '5000+ хөнгөлөлт', category: 'discount' },
      // Өргөн хэвлэл
      { key: 'orgon_banner', value: 8000, label: 'Баннер м²', category: 'khevlel' },
      { key: 'orgon_sticker', value: 12000, label: 'Стикер м²', category: 'khevlel' },
      { key: 'orgon_flag', value: 18000, label: 'Туг м²', category: 'khevlel' },
      { key: 'orgon_fabric', value: 22000, label: 'Даавуу м²', category: 'khevlel' },
      // Промо
      { key: 'promo_pen', value: 2500, label: 'Үзэг', category: 'khevlel' },
      { key: 'promo_notebook', value: 8000, label: 'Дэвтэр', category: 'khevlel' },
      { key: 'promo_mug', value: 12000, label: 'Аяга', category: 'khevlel' },
      { key: 'promo_tshirt', value: 18000, label: 'Футболк', category: 'khevlel' },
      // Шагнал
      { key: 'award_crystal', value: 45000, label: 'Болор өргөмжлөл', category: 'khevlel' },
      { key: 'award_wood', value: 35000, label: 'Модон', category: 'khevlel' },
      { key: 'award_medal', value: 12000, label: 'Медаль', category: 'khevlel' },
      { key: 'award_badge', value: 8000, label: 'Тэмдэг', category: 'khevlel' },
    ];

    await this.repo.save(defaults.map((d) => this.repo.create(d)));
  }
}
