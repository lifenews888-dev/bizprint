import { Repository } from 'typeorm';
import { Variant } from './variant.entity';
export declare class VariantsService {
    private variantRepository;
    constructor(variantRepository: Repository<Variant>);
    create(data: Partial<Variant>): Promise<Variant>;
    findAll(): Promise<Variant[]>;
}
