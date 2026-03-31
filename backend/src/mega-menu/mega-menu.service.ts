import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { MegaMenuV2, MenuColumn, MenuCategory, MenuItemEntity, PromoBlock } from './entities';

@Injectable()
export class MegaMenuService {
  constructor(
    @InjectRepository(MegaMenuV2) private menuRepo: Repository<MegaMenuV2>,
    @InjectRepository(MenuColumn) private columnRepo: Repository<MenuColumn>,
    @InjectRepository(MenuCategory) private categoryRepo: Repository<MenuCategory>,
    @InjectRepository(MenuItemEntity) private itemRepo: Repository<MenuItemEntity>,
    @InjectRepository(PromoBlock) private promoRepo: Repository<PromoBlock>,
  ) {}

  // ═══════════════════════════════════════
  //  PUBLIC API — optimized for frontend
  // ═══════════════════════════════════════

  async getPublicMenu(role?: string) {
    const menu = await this.menuRepo.findOne({
      where: { is_active: true },
      relations: ['columns', 'columns.categories', 'columns.categories.items', 'promos'],
      order: { version: 'DESC' },
    });

    if (!menu) return { columns: [], promos: [] };

    const now = new Date();

    // Filter & sort columns
    const columns = menu.columns
      .filter(col => col.is_active)
      .filter(col => {
        if (!role || !col.visibility_roles?.length) return true;
        return col.visibility_roles.includes(role);
      })
      .sort((a, b) => a.order - b.order)
      .map(col => ({
        id: col.id,
        title: col.title,
        icon: col.icon,
        color: col.color,
        categories: col.categories
          .sort((a, b) => a.order - b.order)
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            image_url: cat.image_url,
            is_featured: cat.is_featured,
            items: cat.items
              .sort((a, b) => a.order - b.order)
              .map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                link: item.link,
                icon: item.icon,
                description: item.description,
                badge: item.badge,
              })),
          })),
      }));

    // Filter active promos by schedule
    const promos = menu.promos
      .filter(p => p.is_active)
      .filter(p => {
        if (p.start_at && new Date(p.start_at) > now) return false;
        if (p.end_at && new Date(p.end_at) < now) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority)
      .map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        image_url: p.image_url,
        link: p.type === 'AI_QUOTE' ? '/smart-quote' : p.link,
        cta_text: p.cta_text,
        bg_color: p.bg_color,
        is_ai: p.type === 'AI_QUOTE',
      }));

    return {
      id: menu.id,
      name: menu.name,
      version: menu.version,
      columns,
      promos,
    };
  }

  // ═══════════════════════════════════════
  //  ADMIN CRUD
  // ═══════════════════════════════════════

  async findAll() {
    return this.menuRepo.find({
      relations: ['columns', 'columns.categories', 'columns.categories.items', 'promos'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string) {
    const menu = await this.menuRepo.findOne({
      where: { id },
      relations: ['columns', 'columns.categories', 'columns.categories.items', 'promos'],
    });
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async create(dto: Partial<MegaMenuV2>) {
    const menu = this.menuRepo.create(dto);
    return this.menuRepo.save(menu);
  }

  async update(id: string, dto: Partial<MegaMenuV2>) {
    const menu = await this.findOne(id);
    Object.assign(menu, dto);
    return this.menuRepo.save(menu);
  }

  async remove(id: string) {
    const result = await this.menuRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Menu not found');
    return { success: true };
  }

  // ─── Column CRUD ───
  async addColumn(menuId: string, dto: Partial<MenuColumn>) {
    const col = this.columnRepo.create({ ...dto, menu_id: menuId });
    return this.columnRepo.save(col);
  }

  async updateColumn(id: string, dto: Partial<MenuColumn>) {
    await this.columnRepo.update(id, dto);
    return this.columnRepo.findOneBy({ id });
  }

  async removeColumn(id: string) {
    await this.columnRepo.delete(id);
    return { success: true };
  }

  // ─── Category CRUD ───
  async addCategory(columnId: string, dto: Partial<MenuCategory>) {
    const cat = this.categoryRepo.create({ ...dto, column_id: columnId });
    return this.categoryRepo.save(cat);
  }

  async updateCategory(id: string, dto: Partial<MenuCategory>) {
    await this.categoryRepo.update(id, dto);
    return this.categoryRepo.findOneBy({ id });
  }

  async removeCategory(id: string) {
    await this.categoryRepo.delete(id);
    return { success: true };
  }

  // ─── Item CRUD ───
  async addItem(categoryId: string, dto: Partial<MenuItemEntity>) {
    const item = this.itemRepo.create({ ...dto, category_id: categoryId });
    return this.itemRepo.save(item);
  }

  async updateItem(id: string, dto: Partial<MenuItemEntity>) {
    await this.itemRepo.update(id, dto);
    return this.itemRepo.findOneBy({ id });
  }

  async removeItem(id: string) {
    await this.itemRepo.delete(id);
    return { success: true };
  }

  // ─── Promo CRUD ───
  async addPromo(menuId: string, dto: Partial<PromoBlock>) {
    const promo = this.promoRepo.create({ ...dto, menu_id: menuId });
    return this.promoRepo.save(promo);
  }

  async updatePromo(id: string, dto: Partial<PromoBlock>) {
    await this.promoRepo.update(id, dto);
    return this.promoRepo.findOneBy({ id });
  }

  async removePromo(id: string) {
    await this.promoRepo.delete(id);
    return { success: true };
  }

  // ─── Reorder ───
  async reorderColumns(items: { id: string; order: number }[]) {
    for (const item of items) await this.columnRepo.update(item.id, { order: item.order });
    return { success: true };
  }

  async reorderCategories(items: { id: string; order: number }[]) {
    for (const item of items) await this.categoryRepo.update(item.id, { order: item.order });
    return { success: true };
  }

  async reorderItems(items: { id: string; order: number }[]) {
    for (const item of items) await this.itemRepo.update(item.id, { order: item.order });
    return { success: true };
  }
}
