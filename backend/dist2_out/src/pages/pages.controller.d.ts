import { PagesService } from './pages.service';
export declare class PagesController {
    private readonly service;
    constructor(service: PagesService);
    getPublished(): Promise<import("./page.entity").Page[]>;
    getByType(type: string): Promise<import("./page.entity").Page[]>;
    getBySlug(slug: string): Promise<import("./page.entity").Page>;
    getAll(): Promise<import("./page.entity").Page[]>;
    create(body: any): Promise<import("./page.entity").Page>;
    update(id: string, body: any): Promise<import("./page.entity").Page>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
