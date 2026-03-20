import { Repository } from 'typeorm';
import { Category } from './category.entity';
export declare class CategoriesService {
    private repo;
    constructor(repo: Repository<Category>);
    findAll(): Promise<Category[]>;
    findTree(): Promise<{
        children: Category[];
        id: string;
        name: string;
        name_mn: string;
        slug: string;
        description: string;
        icon: string;
        color: string;
        parent_id: string;
        parent: Category;
        sort_order: number;
        is_active: boolean;
        created_at: Date;
    }[]>;
    create(dto: Partial<Category>): Promise<Category>;
    update(id: string, dto: Partial<Category>): Promise<Category>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
