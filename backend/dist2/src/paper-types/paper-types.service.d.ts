import { Repository } from 'typeorm';
import { PaperType } from './paper-type.entity';
export declare class PaperTypesService {
    private repo;
    constructor(repo: Repository<PaperType>);
    findAll(): Promise<PaperType[]>;
    findActive(): Promise<PaperType[]>;
    create(data: Partial<PaperType>): Promise<PaperType>;
    update(id: string, data: Partial<PaperType>): Promise<PaperType>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
