import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import {
  priceCatalogLine,
  type CatalogFormula,
  type CatalogLine,
} from '../products/catalog-pricing';

export interface FlowCatalogQuoteInput {
  productSlug: string;
  variantCode: string;
  widthM?: number;
  heightM?: number;
  quantity: number;
  sides?: number;
  addons?: Record<string, number>;
  /** Тусдаа мөрөөр бодогдох нэмэлт бараа (шон, суурь, иш …) — ижил эсвэл өөр бүтээгдэхүүнээс */
  extras?: { productSlug?: string; variantCode: string; quantity: number }[];
}

export interface FlowCatalogExtra {
  productSlug: string;
  variantCode: string;
  label: string;
  quantity: number;
  total: number;
}

export interface FlowCatalogQuote {
  productSlug: string;
  productName: string;
  variantCode: string;
  variantLabel: string;
  unit: string;
  line: CatalogLine;
  sides: number;
  quantity: number;
  total: number;
  amountExVat: number;
  vat: number;
  unitPrice: number;
  mainTotal: number;
  extras: FlowCatalogExtra[];
}

type CatalogVariant = {
  code: string;
  family?: string;
  option?: string;
  unit: string;
  inc: number;
  ex?: number;
  presets?: { w: number; h: number; inc?: number }[];
  addon?: boolean;
  min?: number;
  tiers?: { min: number; inc: number }[];
};

/**
 * Албан үнийн жагсаалт (products.pricing_mode='catalog') — сайт, сагс, чатбот, n8n бүгд
 * эндээс нэг ижил үнэ авна. Үнийг products/catalog-pricing.ts#priceCatalogLine бодно.
 */
@Injectable()
export class FlowCatalogService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  /** Чатботод зориулсан товч жагсаалт: бүтээгдэхүүн бүрийн хувилбар, нэгж, НӨАТ орсон үнэ */
  async list(category?: string) {
    const where: Record<string, unknown> = {
      pricing_mode: 'catalog',
      is_active: true,
    };
    if (category) where.category = category;
    const rows = await this.products.find({
      where,
      order: { sort_order: 'ASC' },
      take: 200,
    });
    return rows.map((p) => ({
      slug: p.slug,
      name: p.name_mn || p.name,
      category: p.category,
      description: p.description,
      requiresDimensions: !!p.requires_dimensions,
      variants: this.variants(p).map((v) => ({
        code: v.code,
        label: [v.family, v.option].filter(Boolean).join(' — '),
        unit: v.unit,
        priceIncVat: v.inc,
        addon: !!v.addon,
        min: v.min,
        tiers: v.tiers,
        presets: v.presets,
      })),
    }));
  }

  async quote(input: FlowCatalogQuoteInput): Promise<FlowCatalogQuote> {
    const product = await this.products.findOne({
      where: { slug: input.productSlug, pricing_mode: 'catalog' },
    });
    if (!product || !product.is_active) {
      throw new NotFoundException(
        `Бүтээгдэхүүн олдсонгүй: ${input.productSlug}`,
      );
    }
    const variant = this.variants(product).find(
      (v) => v.code === input.variantCode && !v.addon,
    );
    if (!variant) {
      throw new BadRequestException(
        `Хувилбар олдсонгүй: ${input.productSlug} / ${input.variantCode}`,
      );
    }
    const quantity = Math.max(1, Math.round(Number(input.quantity) || 1));
    const line: CatalogLine = {
      kind: 'item',
      code: variant.code,
      qty: quantity,
    };
    if (variant.unit === 'm2') {
      const w = Number(input.widthM);
      const h = Number(input.heightM);
      if (!(w > 0 && h > 0) || w > 50 || h > 50) {
        throw new BadRequestException(
          'Хэмжээ (метрээр өргөн, өндөр) шаардлагатай',
        );
      }
      line.w = Math.round(w * 1000) / 1000;
      line.h = Math.round(h * 1000) / 1000;
    }
    if (input.addons && Object.keys(input.addons).length) {
      const known = new Set(
        this.variants(product)
          .filter((v) => v.addon)
          .map((v) => v.code),
      );
      for (const code of Object.keys(input.addons)) {
        if (!known.has(code)) {
          throw new BadRequestException(`Нэмэлт олдсонгүй: ${code}`);
        }
      }
      line.addons = input.addons;
    }

    const priced = priceCatalogLine(
      product.price_formula as CatalogFormula,
      line,
    );
    if (!priced) throw new BadRequestException('Үнэ бодогдсонгүй');

    // Хоёр талт хэвлэл: м²-ээр бодогддог даавуун хэвлэлд 2 дахин (BizPrint-ийн дүрэм)
    const sides = Number(input.sides) === 2 && variant.unit === 'm2' ? 2 : 1;
    const mainTotal = priced.total * sides;

    const extras: FlowCatalogExtra[] = [];
    for (const x of (input.extras || []).slice(0, 5)) {
      extras.push(await this.priceExtra(x, product));
    }
    const total = mainTotal + extras.reduce((a, e) => a + e.total, 0);
    const amountExVat = Math.round(total / 1.1);
    return {
      productSlug: product.slug,
      productName: product.name_mn || product.name,
      variantCode: variant.code,
      variantLabel: [variant.family, variant.option]
        .filter(Boolean)
        .join(' — '),
      unit: variant.unit,
      line,
      sides,
      quantity: priced.cartQty,
      mainTotal,
      extras,
      total,
      amountExVat,
      vat: total - amountExVat,
      unitPrice: Math.round(mainTotal / Math.max(1, priced.cartQty)),
    };
  }

  /** Ширхгээр бодогдох нэмэлт мөр (шон, суурь, иш). м² хувилбарыг нэмэлтээр авахгүй. */
  private async priceExtra(
    x: { productSlug?: string; variantCode: string; quantity: number },
    main: Product,
  ): Promise<FlowCatalogExtra> {
    const product =
      !x.productSlug || x.productSlug === main.slug
        ? main
        : await this.products.findOne({
            where: { slug: x.productSlug, pricing_mode: 'catalog' },
          });
    if (!product || !product.is_active) {
      throw new NotFoundException(
        `Нэмэлт бүтээгдэхүүн олдсонгүй: ${x.productSlug}`,
      );
    }
    const v = this.variants(product).find(
      (it) => it.code === x.variantCode && !it.addon,
    );
    if (!v || v.unit === 'm2') {
      throw new BadRequestException(`Нэмэлт хувилбар буруу: ${x.variantCode}`);
    }
    const qty = Math.max(
      1,
      Math.min(1000, Math.round(Number(x.quantity) || 1)),
    );
    const priced = priceCatalogLine(product.price_formula as CatalogFormula, {
      kind: 'item',
      code: v.code,
      qty,
    });
    if (!priced)
      throw new BadRequestException(`Нэмэлтийн үнэ бодогдсонгүй: ${v.code}`);
    return {
      productSlug: product.slug,
      variantCode: v.code,
      label: [v.family, v.option].filter(Boolean).join(' — '),
      quantity: priced.cartQty,
      total: priced.total,
    };
  }

  private variants(p: Product): CatalogVariant[] {
    const f = p.price_formula as { type?: string; variants?: CatalogVariant[] };
    return f && f.type === 'catalog' && Array.isArray(f.variants)
      ? f.variants
      : [];
  }
}
