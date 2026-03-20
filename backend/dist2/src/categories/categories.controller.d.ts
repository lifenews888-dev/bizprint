import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private svc;
    constructor(svc: CategoriesService);
    findAll(): Promise<import("./category.entity").Category[]>;
    findTree(): Promise<{
        children: import("./category.entity").Category[];
        id: string;
        name: string;
        name_mn: string;
        slug: string;
        description: string;
        icon: string;
        color: string;
        parent_id: string;
        parent: import("./category.entity").Category;
        sort_order: number;
        is_active: boolean;
        created_at: Date;
    }[]>;
    create(dto: any): Promise<import("./category.entity").Category>;
    update(id: string, dto: any): Promise<import("./category.entity").Category>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
