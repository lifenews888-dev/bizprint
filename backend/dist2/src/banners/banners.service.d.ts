import { Repository } from 'typeorm';
import { Banner } from './banner.entity';
export declare class BannersService {
    private repo;
    constructor(repo: Repository<Banner>);
    findAll(): Promise<Banner[]>;
    findActive(): Promise<Banner[]>;
    findOne(id: number): Promise<Banner>;
    create(data: Partial<Banner>): Promise<Banner>;
    update(id: number, data: Partial<Banner>): Promise<Banner>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
