import { PaperTypesService } from './paper-types.service';
export declare class PaperTypesController {
    private svc;
    constructor(svc: PaperTypesService);
    findAll(): Promise<import("./paper-type.entity").PaperType[]>;
    findActive(): Promise<import("./paper-type.entity").PaperType[]>;
    create(body: any): Promise<import("./paper-type.entity").PaperType>;
    update(id: string, body: any): Promise<import("./paper-type.entity").PaperType>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
