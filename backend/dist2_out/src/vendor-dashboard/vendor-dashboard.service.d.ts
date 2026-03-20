import { Repository } from 'typeorm';
import { ProductionJob } from '../production/entities/production-job.entity';
export declare class VendorDashboardService {
    private productionRepo;
    constructor(productionRepo: Repository<ProductionJob>);
    getVendorJobs(vendorId: string): Promise<ProductionJob[]>;
    getQueue(vendorId: string): Promise<ProductionJob[]>;
    assignMachine(jobId: string, machineId: string): Promise<ProductionJob>;
    startPrinting(jobId: string): Promise<ProductionJob>;
    finishJob(jobId: string): Promise<ProductionJob>;
}
