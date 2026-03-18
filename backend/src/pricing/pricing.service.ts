import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { PricingRule } from '../pricing-rules/pricing-rule.entity';

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
  breakdown: Record<string, any>;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(PricingRule)
    private rulesRepo: Repository<PricingRule>,
  ) {}

  async calculateQuote(input: QuoteInput): Promise<QuoteResult> {
    const product = await this.productRepo.findOne({
      where: { id: input.product_id, is_active: true },
    });
    if (!product) throw new NotFoundException('\u0411\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d \u043e\u043b\u0434\u0441\u043e\u043d\u0433\u04af\u0439');

    const base_price = Number(product.base_price);
    const quantity = input.quantity;

    let qty_multiplier = 1.0;
    if (quantity >= 5000)      qty_multiplier = 0.70;
    else if (quantity >= 2000) qty_multiplier = 0.80;
    else if (quantity >= 1000) qty_multiplier = 0.85;
    else if (quantity >= 500)  qty_multiplier = 0.90;
    else if (quantity >= 250)  qty_multiplier = 0.95;

    const rules = await this.rulesRepo.find({
      where: { product_id: input.product_id, is_active: true },
    });

    let option_multiplier = 1.0;
    let option_addition = 0;
    const applied_rules: string[] = [];

    if (input.options && rules.length > 0) {
      for (const [key, value] of Object.entries(input.options)) {
        const rule = rules.find(
          r => r.attribute_key === key && r.attribute_value === value,
        );
        if (rule) {
          option_multiplier += Number(rule.price_multiplier);
          option_addition += Number(rule.price_addition);
          applied_rules.push(key + '=' + value);
        }
      }
    }

    const rush_multiplier = input.rush ? 1.35 : 1.0;

    const unit_price = Math.round(
      base_price * qty_multiplier * option_multiplier * rush_multiplier + option_addition,
    );
    const setup_fee = quantity < 500 ? 15000 : 0;
    const subtotal = unit_price * quantity + setup_fee;
    const platform_margin = Math.round(subtotal * 0.15);
    const delivery_fee = input.delivery ? 15000 : 0;
    const total = subtotal + platform_margin + delivery_fee;

    const valid_until = new Date();
    valid_until.setHours(valid_until.getHours() + 24);

    return {
      product_id: product.id,
      product_name: product.name_mn || product.name,
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
        option_addition,
        applied_rules,
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