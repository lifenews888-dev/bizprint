import { Repository } from 'typeorm';
import { Setting } from './settings.entity';
export declare class SettingsService {
    private repo;
    constructor(repo: Repository<Setting>);
    getAll(): Promise<Record<string, string>>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, type?: string, label?: string): Promise<Setting>;
    bulkSet(data: Record<string, string>): Promise<void>;
    delete(key: string): Promise<void>;
}
