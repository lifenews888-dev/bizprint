import { TemplatesService } from './templates.service';
export declare class TemplatesController {
    private readonly service;
    constructor(service: TemplatesService);
    findAll(query: any): Promise<import("./template.entity").Template[]>;
    findPending(): Promise<import("./template.entity").Template[]>;
    findByDesigner(id: string): Promise<import("./template.entity").Template[]>;
    findOne(id: string): Promise<import("./template.entity").Template>;
    create(body: any): Promise<import("./template.entity").Template>;
    update(id: string, body: any): Promise<import("./template.entity").Template>;
    approve(id: string): Promise<import("./template.entity").Template>;
    reject(id: string): Promise<import("./template.entity").Template>;
    incrementUse(id: string): Promise<void>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
