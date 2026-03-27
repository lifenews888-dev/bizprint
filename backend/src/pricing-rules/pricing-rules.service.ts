import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRule } from './pricing-rule.entity';

@Injectable()
export class PricingRulesService {
  constructor(
    @InjectRepository(PricingRule)
    private repo: Repository<PricingRule>,
  ) {}

  findAll() {
    return this.repo.find({ order: { attribute_key: 'ASC' } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<PricingRule>) {
    const rule = this.repo.create(data);
    return this.repo.save(rule);
  }

  async update(id: string, data: Partial<PricingRule>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async findMatchingRules(params: {
    product_id?: string
    product_master_id?: string
    category_id?: string
    attributes?: Record<string, string>
    quantity?: number
  }): Promise<PricingRule[]> {
    const rules = await this.repo.find({ where: { is_active: true } })
    return rules.filter(rule => {
      // Scope checks: rule must match the given scope (if rule has a scope set)
      if (rule.product_id && rule.product_id !== params.product_id) return false
      if (rule.product_master_id && rule.product_master_id !== params.product_master_id) return false
      if (rule.category_id && rule.category_id !== params.category_id) return false
      // Quantity threshold
      if (rule.min_quantity && (params.quantity || 0) < rule.min_quantity) return false
      // Attribute matching
      if (rule.attribute_key && params.attributes) {
        const val = params.attributes[rule.attribute_key]
        if (val === undefined) return false   // attribute not present → skip
        if (rule.attribute_value && val !== rule.attribute_value) return false
      }
      return true
    })
  }

  applyRules(basePrice: number, rules: PricingRule[]): { adjusted: number; applied: string[] } {
    let price = basePrice
    const applied: string[] = []
    for (const rule of rules) {
      if (rule.price_override != null) {
        price = Number(rule.price_override)
        applied.push(`override:${rule.attribute_key}=${rule.price_override}`)
      } else {
        if (rule.price_multiplier != null) {
          price = Math.round(price * Number(rule.price_multiplier))
          applied.push(`multiplier:${rule.attribute_key}=x${rule.price_multiplier}`)
        }
        if (rule.price_addition != null) {
          price += Number(rule.price_addition)
          applied.push(`addition:${rule.attribute_key}=+${rule.price_addition}`)
        }
      }
    }
    return { adjusted: Math.round(price), applied }
  }
}