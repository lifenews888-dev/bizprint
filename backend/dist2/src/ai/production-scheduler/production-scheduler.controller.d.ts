import { ProductionSchedulerService } from './production-scheduler.service';
export declare class ProductionSchedulerController {
    private readonly service;
    constructor(service: ProductionSchedulerService);
    schedule(body: any): {
        total_orders: number;
        schedule: any[];
    };
}
