import { Repository } from 'typeorm';
import { ProductionJob } from './entities/production-job.entity';
export declare class ProductionService {
    private productionRepo;
    constructor(productionRepo: Repository<ProductionJob>);
    createJob(orderId: string): Promise<ProductionJob>;
    getAllJobs(): Promise<ProductionJob[]>;
    getJob(id: string): Promise<ProductionJob>;
    assignMachine(jobId: string, machineId: string, vendorId: string): Promise<ProductionJob>;
    startJob(jobId: string): Promise<ProductionJob>;
    completeJob(jobId: string): Promise<ProductionJob>;
    getJobsByOrder(orderId: string): Promise<ProductionJob[]>;
}
