import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CategoryParameter } from './category-parameter.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
    @InjectRepository(CategoryParameter) private paramRepo: Repository<CategoryParameter>,
  ) {}

  async findAll() { return this.repo.find({ order: { sort_order: 'ASC' } }); }

  async findTree() {
    const all = await this.repo.find({ order: { sort_order: 'ASC' } });
    const roots = all.filter(c => !c.parent_id);
    return roots.map(r => ({ ...r, children: all.filter(c => c.parent_id === r.id) }));
  }

  async getNavigation() {
    const all = await this.repo.find({ where: { is_active: true }, order: { sort_order: 'ASC' } });
    const roots = all.filter(c => !c.parent_id);
    return roots.map(r => ({
      id: r.id, name: r.name, name_mn: r.name_mn, slug: r.slug, icon: r.icon,
      show_in_menu: (r as any).show_in_menu ?? true,
      children: all.filter(c => c.parent_id === r.id).map(c => ({ id: c.id, name: c.name, name_mn: c.name_mn, slug: c.slug, icon: c.icon })),
    }));
  }

  async create(dto: Partial<Category>) {
    if (!dto.name) throw new Error('Ангиллын нэр шаардлагатай');

    // Auto-generate slug if missing
    if (!dto.slug) {
      dto.slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-\u0400-\u04ff]/g, '') + '-' + Date.now().toString(36);
    }

    try {
      return await this.repo.save(this.repo.create(dto));
    } catch (e: any) {
      if (e.code === '23505') { // Unique violation
        if (e.detail?.includes('name')) throw new Error('Энэ нэр ашиглагдсан байна');
        if (e.detail?.includes('slug')) throw new Error('Энэ slug ашиглагдсан байна');
        throw new Error('Давхардсан өгөгдөл');
      }
      throw e;
    }
  }

  async update(id: string, dto: Partial<Category>) {
    try {
      await this.repo.update(id, dto);
      return this.repo.findOne({ where: { id } });
    } catch (e: any) {
      if (e.code === '23505') throw new Error('Давхардсан нэр эсвэл slug');
      throw e;
    }
  }
  async remove(id: string) {
    // Delete children first, then parent
    await this.repo.delete({ parent_id: id });
    await this.paramRepo.delete({ category_id: id });
    await this.repo.delete(id);
    return { success: true };
  }

  // ─── Seed: organize categories + create subcategories ───
  async seedGroups() {
    // Step 1: Create parent groups
    const GROUPS = [
      { name: 'Offset Print', name_mn: 'Офсет хэвлэл', slug: 'offset', icon: '🖨️', color: '#378ADD',
        childSlugs: ['business-card', 'flyer', 'book', 'office', 'events'] },
      { name: 'Digital Print', name_mn: 'Дижитал хэвлэл', slug: 'digital', icon: '🏷️', color: '#22c55e',
        childSlugs: ['sticker', 'packaging'] },
      { name: 'Wide Format', name_mn: 'Өргөн формат', slug: 'wide-format', icon: '🪧', color: '#eab308',
        childSlugs: ['urgun_hevlel', 'banner', 'signage'] },
      { name: 'Promo & Apparel', name_mn: 'Промо & Хувцас', slug: 'promo', icon: '👕', color: '#a855f7',
        childSlugs: ['merchandise', 'apparel'] },
    ];

    const all = await this.repo.find();
    const created: any[] = [];

    for (let i = 0; i < GROUPS.length; i++) {
      const g = GROUPS[i];
      let parent = all.find(c => c.slug === g.slug);
      if (!parent) {
        parent = await this.repo.save(this.repo.create({
          name: g.name, name_mn: g.name_mn, slug: g.slug,
          icon: g.icon, color: g.color, sort_order: i,
          is_active: true, show_in_menu: true,
        }));
      }
      for (const childSlug of g.childSlugs) {
        const child = all.find(c => c.slug === childSlug || c.slug?.startsWith(childSlug));
        if (child && !child.parent_id) {
          await this.repo.update(child.id, { parent_id: parent.id, show_in_menu: true });
        }
      }
      created.push({ parent: parent.name_mn || parent.name, children: g.childSlugs });
    }

    // Step 2: Create subcategories for each existing category
    const SUBS: Record<string, { name: string; name_mn: string; slug: string }[]> = {
      'business-card': [
        { name: 'Standard Business Card', name_mn: 'Энгийн визит карт', slug: 'bc-standard' },
        { name: 'Premium Business Card', name_mn: 'Премиум визит карт', slug: 'bc-premium' },
        { name: 'Folded Business Card', name_mn: 'Нугалсан визит карт', slug: 'bc-folded' },
        { name: 'Spot UV Business Card', name_mn: 'UV визит карт', slug: 'bc-spot-uv' },
        { name: 'Foil Business Card', name_mn: 'Фольг визит карт', slug: 'bc-foil' },
        { name: 'Transparent Card', name_mn: 'Тунгалаг карт', slug: 'bc-transparent' },
        { name: 'Die-Cut Card', name_mn: 'Хэлбэртэй карт', slug: 'bc-die-cut' },
      ],
      'flyer': [
        { name: 'A4 Flyer', name_mn: 'A4 Флаер', slug: 'flyer-a4' },
        { name: 'A5 Flyer', name_mn: 'A5 Флаер', slug: 'flyer-a5' },
        { name: 'A6 Flyer', name_mn: 'A6 Флаер', slug: 'flyer-a6' },
        { name: 'DL Flyer', name_mn: 'DL Флаер', slug: 'flyer-dl' },
        { name: 'Poster', name_mn: 'Постер', slug: 'poster' },
        { name: 'Brochure', name_mn: 'Брошур', slug: 'brochure' },
        { name: 'Tri-Fold', name_mn: 'Гурвалсан нугалалт', slug: 'tri-fold' },
        { name: 'Bi-Fold', name_mn: 'Хоёр нугалалт', slug: 'bi-fold' },
        { name: 'Z-Fold', name_mn: 'Z нугалалт', slug: 'z-fold' },
        { name: 'Menu Card', name_mn: 'Цэсийн карт', slug: 'menu-card' },
      ],
      'book': [
        { name: 'Catalog', name_mn: 'Каталог', slug: 'catalog' },
        { name: 'Magazine', name_mn: 'Сэтгүүл', slug: 'magazine' },
        { name: 'Booklet', name_mn: 'Товхимол', slug: 'booklet' },
        { name: 'Perfect Bind Book', name_mn: 'Цавуулсан ном', slug: 'book-perfect' },
        { name: 'Saddle Stitch', name_mn: 'Зүүгдэлт ном', slug: 'book-saddle' },
        { name: 'Hardcover Book', name_mn: 'Хатуу хавтастай ном', slug: 'book-hardcover' },
        { name: 'Wire-O Bind', name_mn: 'Торон боолт', slug: 'book-wire-o' },
        { name: 'Notebook', name_mn: 'Дэвтэр', slug: 'notebook' },
      ],
      'sticker': [
        { name: 'Paper Sticker', name_mn: 'Цаасан наалт', slug: 'sticker-paper' },
        { name: 'Vinyl Sticker', name_mn: 'Винил наалт', slug: 'sticker-vinyl' },
        { name: 'Transparent Sticker', name_mn: 'Тунгалаг наалт', slug: 'sticker-transparent' },
        { name: 'Die-Cut Sticker', name_mn: 'Хэлбэртэй наалт', slug: 'sticker-die-cut' },
        { name: 'Roll Label', name_mn: 'Ороомог шошго', slug: 'sticker-roll' },
        { name: 'Hologram Sticker', name_mn: 'Голограмм наалт', slug: 'sticker-hologram' },
        { name: 'Floor Sticker', name_mn: 'Шалны наалт', slug: 'sticker-floor' },
        { name: 'Car Wrap', name_mn: 'Машины наалт', slug: 'sticker-car' },
      ],
      'packaging': [
        { name: 'Product Box', name_mn: 'Бүтээгдэхүүний хайрцаг', slug: 'box-product' },
        { name: 'Gift Box', name_mn: 'Бэлгийн хайрцаг', slug: 'box-gift' },
        { name: 'Paper Bag', name_mn: 'Цаасан уут', slug: 'bag-paper' },
        { name: 'Shopping Bag', name_mn: 'Дэлгүүрийн уут', slug: 'bag-shopping' },
        { name: 'Food Box', name_mn: 'Хоолны хайрцаг', slug: 'box-food' },
        { name: 'Sleeve', name_mn: 'Гуйвдас', slug: 'sleeve' },
        { name: 'Hang Tag', name_mn: 'Зүүлт шошго', slug: 'hang-tag' },
        { name: 'Wrapping Paper', name_mn: 'Боодлын цаас', slug: 'wrapping-paper' },
      ],
      'banner': [
        { name: 'Outdoor Banner', name_mn: 'Гадна баннер', slug: 'banner-outdoor' },
        { name: 'Indoor Banner', name_mn: 'Дотор баннер', slug: 'banner-indoor' },
        { name: 'Mesh Banner', name_mn: 'Торон баннер', slug: 'banner-mesh' },
        { name: 'Backlit Banner', name_mn: 'Гэрэлтүүлэгт баннер', slug: 'banner-backlit' },
        { name: 'X-Banner Stand', name_mn: 'X-баннер стенд', slug: 'banner-x-stand' },
        { name: 'Roll-Up Banner', name_mn: 'Роллап баннер', slug: 'banner-rollup' },
        { name: 'Pop-Up Display', name_mn: 'Поп-ап дэлгэц', slug: 'banner-popup' },
        { name: 'Fabric Banner', name_mn: 'Даавуун баннер', slug: 'banner-fabric' },
      ],
      'signage': [
        { name: '3D Letter Sign', name_mn: '3D үсэг хаяг', slug: 'sign-3d-letter' },
        { name: 'Lightbox', name_mn: 'Лайтбокс', slug: 'sign-lightbox' },
        { name: 'Neon Sign', name_mn: 'Неон хаяг', slug: 'sign-neon' },
        { name: 'Acrylic Sign', name_mn: 'Акрил хаяг', slug: 'sign-acrylic' },
        { name: 'Metal Sign', name_mn: 'Металл хаяг', slug: 'sign-metal' },
        { name: 'Pylon Sign', name_mn: 'Пилон самбар', slug: 'sign-pylon' },
        { name: 'Directory Board', name_mn: 'Чиглүүлэх самбар', slug: 'sign-directory' },
        { name: 'A-Frame Sign', name_mn: 'А-хэлбэрт самбар', slug: 'sign-a-frame' },
      ],
      'merchandise': [
        { name: 'Custom Mug', name_mn: 'Аяга хэвлэл', slug: 'merch-mug' },
        { name: 'Pen', name_mn: 'Бал хэвлэл', slug: 'merch-pen' },
        { name: 'Keychain', name_mn: 'Түлхүүрийн оосор', slug: 'merch-keychain' },
        { name: 'USB Flash', name_mn: 'USB санах ой', slug: 'merch-usb' },
        { name: 'Tote Bag', name_mn: 'Даавуун цүнх', slug: 'merch-tote' },
        { name: 'Cap/Hat', name_mn: 'Малгай', slug: 'merch-cap' },
        { name: 'Lanyard', name_mn: 'Бэлтгэл оосор', slug: 'merch-lanyard' },
        { name: 'Badge/Pin', name_mn: 'Бэлгэ тэмдэг', slug: 'merch-badge' },
      ],
      'apparel': [
        { name: 'T-Shirt Print', name_mn: 'Цамц хэвлэл', slug: 'apparel-tshirt' },
        { name: 'Polo Shirt', name_mn: 'Поло цамц', slug: 'apparel-polo' },
        { name: 'Hoodie', name_mn: 'Худи', slug: 'apparel-hoodie' },
        { name: 'Jacket', name_mn: 'Куртка', slug: 'apparel-jacket' },
        { name: 'Uniform', name_mn: 'Дүрэмт хувцас', slug: 'apparel-uniform' },
        { name: 'Apron', name_mn: 'Хормогч', slug: 'apparel-apron' },
        { name: 'Sports Jersey', name_mn: 'Спорт хувцас', slug: 'apparel-jersey' },
      ],
      'office': [
        { name: 'Letterhead', name_mn: 'Албан бланк', slug: 'office-letterhead' },
        { name: 'Envelope', name_mn: 'Дугтуй', slug: 'office-envelope' },
        { name: 'Invoice Pad', name_mn: 'Нэхэмжлэх дэвтэр', slug: 'office-invoice' },
        { name: 'NCR Form', name_mn: 'Хуулбарт маягт', slug: 'office-ncr' },
        { name: 'Stamp', name_mn: 'Тамга', slug: 'office-stamp' },
        { name: 'Certificate', name_mn: 'Гэрчилгээ', slug: 'office-certificate' },
        { name: 'ID Card', name_mn: 'Үнэмлэх', slug: 'office-id-card' },
        { name: 'Receipt Book', name_mn: 'Баримтын дэвтэр', slug: 'office-receipt' },
        { name: 'Folder', name_mn: 'Хавтас', slug: 'office-folder' },
        { name: 'Presentation Folder', name_mn: 'Танилцуулгын хавтас', slug: 'office-pres-folder' },
      ],
      'events': [
        { name: 'Invitation Card', name_mn: 'Урилга', slug: 'event-invitation' },
        { name: 'Ticket', name_mn: 'Тасалбар', slug: 'event-ticket' },
        { name: 'Wristband', name_mn: 'Бугуйвч', slug: 'event-wristband' },
        { name: 'Backdrop', name_mn: 'Арын дэвсгэр', slug: 'event-backdrop' },
        { name: 'Table Tent', name_mn: 'Ширээний тент', slug: 'event-table-tent' },
        { name: 'Name Badge', name_mn: 'Нэрийн бэлгэ', slug: 'event-name-badge' },
        { name: 'Program Booklet', name_mn: 'Хөтөлбөрийн товхимол', slug: 'event-program' },
        { name: 'Coupon/Voucher', name_mn: 'Купон/Ваучер', slug: 'event-coupon' },
      ],
    };

    // Reload all categories (including newly created parents)
    const refreshed = await this.repo.find();
    let subCount = 0;
    for (const [parentSlug, subs] of Object.entries(SUBS)) {
      const parent = refreshed.find(c => c.slug === parentSlug);
      if (!parent) continue;
      for (let si = 0; si < subs.length; si++) {
        const s = subs[si];
        const exists = refreshed.find(c => c.slug === s.slug);
        if (!exists) {
          await this.repo.save(this.repo.create({
            name: s.name, name_mn: s.name_mn, slug: s.slug,
            parent_id: parent.id, sort_order: si,
            is_active: true, show_in_menu: true,
          }));
          subCount++;
        }
      }
    }

    return { message: `Groups seeded, ${subCount} subcategories created`, groups: created };
  }

  // ─── Parameters ───
  async getParameters(categoryId?: string) {
    const where: any = { is_active: true };
    if (categoryId) where.category_id = categoryId;
    return this.paramRepo.find({ where, order: { sort_order: 'ASC' }, relations: ['category'] });
  }

  async getParametersByCategorySlug(slug: string) {
    const cat = await this.repo.findOne({ where: { slug } });
    if (!cat) return [];
    // Get category-specific + global parameters
    return this.paramRepo.find({
      where: [{ category_id: cat.id, is_active: true }, { is_global: true, is_active: true }],
      order: { sort_order: 'ASC' },
    });
  }

  async createParameter(dto: Partial<CategoryParameter>) {
    return this.paramRepo.save(this.paramRepo.create(dto));
  }

  async updateParameter(id: string, dto: Partial<CategoryParameter>) {
    await this.paramRepo.update(id, dto);
    return this.paramRepo.findOne({ where: { id } });
  }

  async removeParameter(id: string) {
    await this.paramRepo.delete(id);
    return { success: true };
  }

  // ─── Price calculation with parameters ───
  calculateWithParameters(basePrice: number, quantity: number, selectedOptions: { paramId: string; value: string }[], params: CategoryParameter[]) {
    let adjustment = 0;

    for (const sel of selectedOptions) {
      const param = params.find(p => p.id === sel.paramId);
      if (!param) continue;

      // Step pricing (tiered)
      if (param.type === 'step_pricing' && param.tiers) {
        const tier = param.tiers.find(t => quantity >= t.min_qty && quantity <= t.max_qty);
        if (tier) return { unit_price: tier.unit_price, total: tier.unit_price * quantity, adjustment: 0 };
      }

      // Option-based adjustment
      const option = param.options?.find(o => o.value === sel.value);
      if (option) {
        if (option.adjustment_type === 'percent') {
          adjustment += Math.round(basePrice * (option.price_adjustment / 100));
        } else {
          adjustment += option.price_adjustment;
        }
      }
    }

    const unitPrice = basePrice + adjustment;
    return { unit_price: unitPrice, total: unitPrice * quantity, adjustment };
  }
}
