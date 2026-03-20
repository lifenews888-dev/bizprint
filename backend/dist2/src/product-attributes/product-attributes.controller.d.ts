import { ProductAttributesService } from './product-attributes.service';
export declare class ProductAttributesController {
    private svc;
    constructor(svc: ProductAttributesService);
    find(productId: string): any[] | Promise<import("./product-attribute.entity").ProductAttribute[]>;
    create(body: any): Promise<import("./product-attribute.entity").ProductAttribute>;
    update(id: string, body: any): Promise<import("./product-attribute.entity").ProductAttribute>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
