import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly service;
    constructor(service: SettingsService);
    getPublic(): Promise<Record<string, string>>;
    getAll(): Promise<Record<string, string>>;
    bulkSet(data: Record<string, string>): Promise<void>;
    set(body: {
        key: string;
        value: string;
        type?: string;
        label?: string;
    }): Promise<import("./settings.entity").Setting>;
    delete(key: string): Promise<void>;
}
