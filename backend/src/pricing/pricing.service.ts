import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';

export interface QuoteInput {
  product_id: string;
  quantity: number;
  options?: Record<string, string>;
  rush?: boolean;
  delivery?: boolean;
}

export interface QuoteResult {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  setup_fee: number;
  subtotal: number;
  platform_margin: number;
  delivery_fee: number;
  total: number;
  currency: string;
  valid_until: string;
  breakdown: Record<string, number>;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async calculateQuote(input: QuoteInput): Promise<QuoteResult> {
    const product = await this.productRepo.findOne({
      where: { id: input.product_id, is_active: true },
    });

    if (!product) {
      throw new NotFoundException('Бүтээгдэхүүн олдсонгүй');
    }

    const base_price = Number(product.base_price);
    const quantity = input.quantity;

    // Quantity break multiplier
    let qty_multiplier = 1.0;
    if (quantity >= 5000) qty_multiplier = 0.70;
    else if (quantity >= 2000) qty_multiplier = 0.80;
    else if (quantity >= 1000) qty_multiplier = 0.85;
    else if (quantity >= 500) qty_multiplier = 0.90;
    else if (quantity >= 250) qty_multiplier = 0.95;

    // Option multipliers
    let option_multiplier = 1.0;
    if (input.options) {
      if (input.options.finish === 'matte_laminate') option_multiplier += 0.20;
      if (input.options.finish === 'gloss_laminate') option_multiplier += 0.18;
      if (input.options.finish === 'soft_touch') option_multiplier += 0.35;
      if (input.options.side === 'double') option_multiplier += 0.70;
      if (input.options.paper_weight === '350gsm') option_multiplier += 0.10;
      if (input.options.paper_weight === '400gsm') option_multiplier += 0.20;
    }

    // Rush surcharge
    const rush_multiplier = input.rush ? 1.35 : 1.0;

    // Calculate
    const unit_price = Math.round(base_price * qty_multiplier * option_multiplier * rush_multiplier);
    const setup_fee = quantity < 500 ? 15000 : 0;
    const subtotal = unit_price * quantity + setup_fee;
    const platform_margin = Math.round(subtotal * 0.15);
    const delivery_fee = input.delivery ? 15000 : 0;
    const total = subtotal + platform_margin + delivery_fee;

    const valid_until = new Date();
    valid_until.setHours(valid_until.getHours() + 24);

    return {
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price,
      setup_fee,
      subtotal,
      platform_margin,
      delivery_fee,
      total,
      currency: 'MNT',
      valid_until: valid_until.toISOString(),
      breakdown: {
        base_price,
        qty_multiplier,
        option_multiplier,
        rush_multiplier,
        unit_price,
        setup_fee,
        subtotal,
        platform_margin_15pct: platform_margin,
        delivery_fee,
        total,
      },
    };
  }
}