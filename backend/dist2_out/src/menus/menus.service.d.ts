import { Repository } from 'typeorm';
import { Menu } from './menu.entity';
export declare class MenusService {
    private repo;
    constructor(repo: Repository<Menu>);
    findAll(): Promise<Menu[]>;
    findByLocation(location: string): Promise<Menu[]>;
    findOne(id: number): Promise<Menu>;
    create(data: Partial<Menu>): Promise<Menu>;
    update(id: number, data: Partial<Menu>): Promise<Menu>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    bulkUpdate(items: Partial<Menu>[]): Promise<Menu[]>;
}
