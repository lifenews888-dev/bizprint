import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRule } from '../pricing-rules/pricing-rule.entity';

/**
 * Canonical Pricing Service — implements CLAUDE.md pricing formula.
 *
 * FORMULA (FINAL — do not change):
 *   customer_price = vendor_cost × (1 + margin_rate)
 *   platform_revenue = customer_price - vendor_cost
 *
 * margin_rate comes from pricing_rules table, matched by
 * product_id, product_master_id, category_id, and attributes.
 *
 * PricingRule uses price_multiplier as the margin rate.
 * Example: price_multiplier = 0.25 means 25% margin.
 */
@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PricingRule)
    private ruleRepo: Repository<PricingRule>,
  ) {}

  /**
   * Calculate customer price from vendor cost and margin rate.
   * customer_price = vendor_cost × (1 + margin_rate)
   */
  calculatePrice(vendor_cost: number, margin_rate: number): {
    vendor_cost: number;
    margin_rate: number;
    customer_price: number;
    platform_revenue: number;
  } {
    const customer_price = Math.round(vendor_cost * (1 + margin_rate));
    const platform_revenue = customer_price - vendor_cost;
    return { vendor_cost, margin_rate, customer_price, platform_revenue };
  }

  /**
   * Calculate platform revenue from a completed transaction.
   * platform_revenue = customer_price - vendor_cost
   */
  calculatePlatformRevenue(customer_price: number, vendor_cost: number): number {
    return customer_price - vendor_cost;
  }

  /**
   * Find the applicable margin rate for a product/vendor combination.
   * Looks up pricing_rules table for matching rules with price_multiplier.
   * Falls back to default margin if no rules match.
   *
   * Priority: product_id > product_master_id > category_id > default
   */
  async findMarginRate(params: {
    product_id?: string;
    product_master_id?: string;
    category_id?: string;
    vendor_id?: string;
  }): Promise<{ margin_rate: number; source: string }> {
    const DEFAULT_MARGIN = 0.25; // 25% default margin

    // Try product-specific rule first
    if (params.product_id) {
      const rule = await this.ruleRepo.findOne({
        where: { product_id: params.product_id, is_active: true },
      });
      if (rule?.price_multiplier != null) {
        return { margin_rate: Number(rule.price_multiplier), source: `product_rule:${rule.id}` };
      }
    }

    // Try product_master-specific rule
    if (params.product_master_id) {
      const rule = await this.ruleRepo.findOne({
        where: { product_master_id: params.product_master_id, is_active: true },
      });
      if (rule?.price_multiplier != null) {
        return { margin_rate: Number(rule.price_multiplier), source: `master_rule:${rule.id}` };
      }
    }

    // Try category-specific rule
    if (params.category_id) {
      const rule = await this.ruleRepo.findOne({
        where: { category_id: params.category_id, is_active: true },
      });
      if (rule?.price_multiplier != null) {
        return { margin_rate: Number(rule.price_multiplier), source: `category_rule:${rule.id}` };
      }
    }

    return { margin_rate: DEFAULT_MARGIN, source: 'default' };
  }

  /**
   * Full price calculation: find margin rate, then calculate customer price.
   */
  async calculateFullPrice(
    vendor_cost: number,
    params: {
      product_id?: string;
      product_master_id?: string;
      category_id?: string;
      vendor_id?: string;
    },
  ) {
    const { margin_rate, source } = await this.findMarginRate(params);
    const pricing = this.calculatePrice(vendor_cost, margin_rate);
    return { ...pricing, margin_source: source };
  }

  // ─── VAT-aware pricing (НӨАТ-тай тооцоолол) ───
  static readonly VAT_RATE = 0.10; // Монгол: 10% НӨАТ

  /**
   * Vendor-ийн НӨАТ-тай үнээс → Хэрэглэгчийн НӨАТ-тай үнэ тооцоолох.
   *
   * Flow:
   *   1. vendor_price_with_vat / (1 + VAT_RATE) = vendor_base (НӨАТ-гүй)
   *   2. vendor_base × (1 + margin_rate) = customer_base (НӨАТ-гүй + margin)
   *   3. customer_base × (1 + VAT_RATE) = customer_price (НӨАТ-тай)
   *
   * CLAUDE.md formula-тай нийцтэй:
   *   customer_price = vendor_cost × (1 + margin_rate) [НӨАТ тусдаа бодогдоно]
   */
  calculateWithVat(vendorPriceWithVat: number, margin_rate: number) {
    const vatRate = PricingService.VAT_RATE;
    const vendorBase = vendorPriceWithVat / (1 + vatRate);
    const customerBase = vendorBase * (1 + margin_rate);
    const customerPrice = Math.round(customerBase * (1 + vatRate));
    const vatAmount = Math.round(customerBase * vatRate);
    const margin = Math.round(customerPrice - vendorPriceWithVat);

    return {
      vendor_price_with_vat: vendorPriceWithVat,
      vendor_base: Math.round(vendorBase),
      margin_rate,
      customer_base: Math.round(customerBase),
      customer_price: customerPrice,
      vat_amount: vatAmount,
      margin,
      platform_revenue: margin,
    };
  }

  /**
   * Full VAT-aware price calculation with auto margin lookup.
   */
  async calculateFullPriceWithVat(
    vendorPriceWithVat: number,
    params: {
      product_id?: string;
      product_master_id?: string;
      category_id?: string;
      vendor_id?: string;
    },
  ) {
    const { margin_rate, source } = await this.findMarginRate(params);
    const pricing = this.calculateWithVat(vendorPriceWithVat, margin_rate);
    return { ...pricing, margin_source: source };
  }
}
