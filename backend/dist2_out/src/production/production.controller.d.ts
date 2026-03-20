import { ProductionService } from './production.service';
export declare class ProductionController {
    private readonly productionService;
    constructor(productionService: ProductionService);
    create(body: any): Promise<import("./entities/production-job.entity").ProductionJob>;
    getAll(): Promise<import("./entities/production-job.entity").ProductionJob[]>;
    getOne(id: string): Promise<import("./entities/production-job.entity").ProductionJob>;
    getByOrder(orderId: string): Promise<import("./entities/production-job.entity").ProductionJob[]>;
    assign(id: string, body: {
        machine_id: string;
        vendor_id: string;
    }): Promise<import("./entities/production-job.entity").ProductionJob>;
    start(id: string): Promise<import("./entities/production-job.entity").ProductionJob>;
    complete(id: string): Promise<import("./entities/production-job.entity").ProductionJob>;
}
