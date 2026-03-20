import { PricingRulesService } from './pricing-rules.service';
export declare class PricingRulesController {
    private svc;
    constructor(svc: PricingRulesService);
    findAll(): Promise<import("./pricing-rule.entity").PricingRule[]>;
    findOne(id: string): Promise<import("./pricing-rule.entity").PricingRule>;
    create(body: any): Promise<import("./pricing-rule.entity").PricingRule>;
    update(id: string, body: any): Promise<import("./pricing-rule.entity").PricingRule>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
