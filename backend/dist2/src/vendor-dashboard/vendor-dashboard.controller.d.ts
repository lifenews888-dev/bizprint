import { VendorDashboardService } from './vendor-dashboard.service';
export declare class VendorDashboardController {
    private readonly service;
    constructor(service: VendorDashboardService);
    getVendorJobs(vendorId: string): Promise<import("../production/entities/production-job.entity").ProductionJob[]>;
    getQueue(vendorId: string): Promise<import("../production/entities/production-job.entity").ProductionJob[]>;
    assignMachine(jobId: string, machineId: string): Promise<import("../production/entities/production-job.entity").ProductionJob>;
    startPrinting(jobId: string): Promise<import("../production/entities/production-job.entity").ProductionJob>;
    finish(jobId: string): Promise<import("../production/entities/production-job.entity").ProductionJob>;
}
