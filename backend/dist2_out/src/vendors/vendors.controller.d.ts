import { VendorsService } from './vendors.service';
export declare class VendorsController {
    private readonly vendorsService;
    constructor(vendorsService: VendorsService);
    create(body: any): Promise<import("./vendor.entity").Vendor[]>;
    findAll(): Promise<import("./vendor.entity").Vendor[]>;
}
