export declare class Category {
    id: string;
    name: string;
    name_mn: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    parent_id: string;
    parent: Category;
    children: Category[];
    sort_order: number;
    is_active: boolean;
    created_at: Date;
}
