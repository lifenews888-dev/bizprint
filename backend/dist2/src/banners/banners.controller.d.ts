import { BannersService } from './banners.service';
export declare class BannersController {
    private readonly service;
    constructor(service: BannersService);
    getActive(): Promise<import("./banner.entity").Banner[]>;
    getAll(): Promise<import("./banner.entity").Banner[]>;
    create(body: any): Promise<import("./banner.entity").Banner>;
    update(id: string, body: any): Promise<import("./banner.entity").Banner>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
