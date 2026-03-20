import { Repository } from 'typeorm';
import { Template } from './template.entity';
export declare class TemplatesService {
    private repo;
    constructor(repo: Repository<Template>);
    findAll(query?: any): Promise<Template[]>;
    findOne(id: string): Promise<Template>;
    create(data: Partial<Template>): Promise<Template>;
    update(id: string, data: Partial<Template>): Promise<Template>;
    approve(id: string): Promise<Template>;
    reject(id: string): Promise<Template>;
    incrementUse(id: string): Promise<void>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
    findPending(): Promise<Template[]>;
    findByDesigner(designer_id: string): Promise<Template[]>;
}
