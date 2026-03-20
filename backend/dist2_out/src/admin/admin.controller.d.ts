import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getUsers(): Promise<User[]>;
    updateRole(id: string, body: {
        role: string;
    }): Promise<User>;
    getVendors(): Promise<import("../vendors/vendor.entity").Vendor[]>;
    getMachines(): Promise<import("../machines/machine.entity").Machine[]>;
    getOrders(): Promise<import("../orders/entities/order.entity").Order[]>;
    getProductionJobs(): Promise<import("../production/entities/production-job.entity").ProductionJob[]>;
    getStats(): Promise<{
        users: number;
        orders: number;
        vendors: number;
        machines: number;
        production: number;
    }>;
}
