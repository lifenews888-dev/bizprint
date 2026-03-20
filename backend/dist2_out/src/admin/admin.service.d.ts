import { Repository } from 'typeorm';
import { Vendor } from '../vendors/vendor.entity';
import { Order } from '../orders/entities/order.entity';
import { Machine } from '../machines/machine.entity';
import { ProductionJob } from '../production/entities/production-job.entity';
import { User } from '../users/user.entity';
export declare class AdminService {
    private vendorRepo;
    private orderRepo;
    private machineRepo;
    private productionRepo;
    private userRepo;
    constructor(vendorRepo: Repository<Vendor>, orderRepo: Repository<Order>, machineRepo: Repository<Machine>, productionRepo: Repository<ProductionJob>, userRepo: Repository<User>);
    getUsers(): Promise<User[]>;
    getVendors(): Promise<Vendor[]>;
    getMachines(): Promise<Machine[]>;
    getOrders(): Promise<Order[]>;
    getProductionJobs(): Promise<ProductionJob[]>;
    updateUserRole(id: string, role: string): Promise<User>;
    getStats(): Promise<{
        users: number;
        orders: number;
        vendors: number;
        machines: number;
        production: number;
    }>;
}
