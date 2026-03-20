import { MenusService } from './menus.service';
export declare class MenusController {
    private readonly service;
    constructor(service: MenusService);
    getByLocation(location: string): Promise<import("./menu.entity").Menu[]>;
    getAll(): Promise<import("./menu.entity").Menu[]>;
    create(body: any): Promise<import("./menu.entity").Menu>;
    bulkUpdate(body: any[]): Promise<import("./menu.entity").Menu[]>;
    update(id: string, body: any): Promise<import("./menu.entity").Menu>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
