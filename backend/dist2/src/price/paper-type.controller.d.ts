import { Repository } from 'typeorm';
import { PaperType } from './paper-type.entity';
export declare class PaperTypeController {
    private repo;
    constructor(repo: Repository<PaperType>);
    create(data: any): Promise<PaperType[]>;
    findAll(): Promise<PaperType[]>;
}
