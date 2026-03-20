import { Repository } from 'typeorm';
import { ProductImage } from './product-image.entity';
export declare class ProductImagesService {
    private repo;
    constructor(repo: Repository<ProductImage>);
    findByProduct(productId: string): Promise<ProductImage[]>;
    create(data: Partial<ProductImage>): Promise<ProductImage>;
    setPrimary(id: string, productId: string): Promise<ProductImage>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
