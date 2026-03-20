import { Repository } from 'typeorm';
import { ProductAttribute } from './product-attribute.entity';
export declare class ProductAttributesService {
    private repo;
    constructor(repo: Repository<ProductAttribute>);
    findByProduct(productId: string): Promise<ProductAttribute[]>;
    create(data: Partial<ProductAttribute>): Promise<ProductAttribute>;
    update(id: string, data: Partial<ProductAttribute>): Promise<ProductAttribute>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
