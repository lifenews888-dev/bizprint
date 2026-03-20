import { Repository } from 'typeorm';
import { PricingRule } from './pricing-rule.entity';
export declare class PricingRulesService {
    private repo;
    constructor(repo: Repository<PricingRule>);
    findAll(): Promise<PricingRule[]>;
    findOne(id: string): Promise<PricingRule>;
    create(data: Partial<PricingRule>): Promise<PricingRule>;
    update(id: string, data: Partial<PricingRule>): Promise<PricingRule>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
