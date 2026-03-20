import { Repository } from 'typeorm';
import { ProductionJob, ProductionJobStatus } from './production-job.entity';
export declare class ProductionJobsService {
    private repo;
    constructor(repo: Repository<ProductionJob>);
    findAll(): Promise<ProductionJob[]>;
    updateStatus(id: number, status: ProductionJobStatus): Promise<ProductionJob>;
    createFromOrder(orderId: string | number): Promise<ProductionJob>;
}
