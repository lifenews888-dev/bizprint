import { Repository } from 'typeorm';
import { ProductVariant } from '../products/product-variant.entity';
export declare class ProductVariantsService {
    private repository;
    constructor(repository: Repository<ProductVariant>);
    create(data: Partial<ProductVariant>): Promise<ProductVariant>;
    findAll(): Promise<ProductVariant[]>;
}
