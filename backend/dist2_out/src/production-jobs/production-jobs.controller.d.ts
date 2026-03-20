import { ProductionJobsService } from './production-jobs.service';
import { ProductionJobStatus } from './production-job.entity';
export declare class ProductionJobsController {
    private readonly service;
    constructor(service: ProductionJobsService);
    findAll(): Promise<import("./production-job.entity").ProductionJob[]>;
    updateStatus(id: number, status: ProductionJobStatus): Promise<import("./production-job.entity").ProductionJob>;
    createFromOrder(orderId: number): Promise<import("./production-job.entity").ProductionJob>;
}
