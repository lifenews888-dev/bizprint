import { ProductVariantsService } from './product-variants.service';
export declare class ProductVariantsController {
    private readonly service;
    constructor(service: ProductVariantsService);
    create(body: any): Promise<import("../products/product-variant.entity").ProductVariant>;
    findAll(): Promise<import("../products/product-variant.entity").ProductVariant[]>;
}
