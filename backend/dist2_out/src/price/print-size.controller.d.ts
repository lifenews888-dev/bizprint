import { Repository } from 'typeorm';
import { PrintSize } from './print-size.entity';
export declare class PrintSizeController {
    private repo;
    constructor(repo: Repository<PrintSize>);
    findAll(): Promise<PrintSize[]>;
    create(data: any): Promise<PrintSize[]>;
}
