import { Repository } from 'typeorm';
import { Product } from './product.entity';
export declare class ProductsService {
    private productRepo;
    constructor(productRepo: Repository<Product>);
    create(data: Partial<Product>): Promise<Product>;
    findAll(categoryId?: string): Promise<any>;
    findOne(id: string): Promise<Product>;
    update(id: string, data: Partial<Product>): Promise<Product>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
    findByVendor(vendorId: string): Promise<Product[]>;
    createForVendor(vendorId: string, data: Partial<Product>): Promise<Product>;
    updateForVendor(vendorId: string, id: string, data: Partial<Product>): Promise<Product>;
    removeForVendor(vendorId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    getVendorOrderStats(vendorId: string): Promise<any>;
}
