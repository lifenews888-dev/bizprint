import { VariantsService } from './variants.service';
export declare class VariantsController {
    private readonly variantsService;
    constructor(variantsService: VariantsService);
    create(body: any): Promise<import("./variant.entity").Variant>;
    findAll(): Promise<import("./variant.entity").Variant[]>;
}
