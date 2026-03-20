import { Vendor } from './vendor.entity';
import { Repository } from 'typeorm';
export declare class VendorsService {
    private repo;
    constructor(repo: Repository<Vendor>);
    create(data: any): Promise<Vendor[]>;
    findAll(): Promise<Vendor[]>;
}
