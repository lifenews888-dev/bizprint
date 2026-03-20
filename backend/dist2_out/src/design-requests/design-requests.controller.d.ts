import { DesignRequestsService } from './design-requests.service';
export declare class DesignRequestsController {
    private svc;
    constructor(svc: DesignRequestsService);
    findAll(): Promise<import("./design-request.entity").DesignRequest[]>;
    findPending(): Promise<import("./design-request.entity").DesignRequest[]>;
    findByDesigner(id: string): Promise<import("./design-request.entity").DesignRequest[]>;
    findByCustomer(id: string): Promise<import("./design-request.entity").DesignRequest[]>;
    findByOrder(id: string): Promise<import("./design-request.entity").DesignRequest[]>;
    findOne(id: string): Promise<import("./design-request.entity").DesignRequest>;
    create(body: any): Promise<import("./design-request.entity").DesignRequest>;
    assign(id: string, body: any): Promise<import("./design-request.entity").DesignRequest>;
    submit(id: string, body: any): Promise<import("./design-request.entity").DesignRequest>;
    approve(id: string): Promise<import("./design-request.entity").DesignRequest>;
    reject(id: string, body: any): Promise<import("./design-request.entity").DesignRequest>;
    update(id: string, body: any): Promise<import("./design-request.entity").DesignRequest>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
