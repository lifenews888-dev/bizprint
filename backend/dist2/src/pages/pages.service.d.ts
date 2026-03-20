import { Repository } from 'typeorm';
import { Page } from './page.entity';
export declare class PagesService {
    private repo;
    constructor(repo: Repository<Page>);
    findAll(): Promise<Page[]>;
    findPublished(): Promise<Page[]>;
    findByType(type: string): Promise<Page[]>;
    findBySlug(slug: string): Promise<Page>;
    findOne(id: number): Promise<Page>;
    create(data: Partial<Page>): Promise<Page>;
    update(id: number, data: Partial<Page>): Promise<Page>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
