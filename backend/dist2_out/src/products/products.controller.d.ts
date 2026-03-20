import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(categoryId?: string): Promise<any>;
    findOne(id: string): Promise<import("./product.entity").Product>;
    create(body: any): Promise<import("./product.entity").Product>;
    update(id: string, body: any): Promise<import("./product.entity").Product>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
export declare class VendorStoreController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getMyProducts(req: any): Promise<import("./product.entity").Product[]>;
    createProduct(req: any, body: any): Promise<import("./product.entity").Product>;
    updateProduct(req: any, id: string, body: any): Promise<import("./product.entity").Product>;
    removeProduct(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
    getStats(req: any): Promise<any>;
}
