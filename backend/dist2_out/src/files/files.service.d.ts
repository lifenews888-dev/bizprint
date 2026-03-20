import { Repository } from 'typeorm';
import { File, FileType } from './file.entity';
export declare class FilesService {
    private readonly repo;
    constructor(repo: Repository<File>);
    findByOrder(orderId: string): Promise<File[]>;
    findFinal(orderId: string): Promise<File | null>;
    getNextVersion(orderId: string): Promise<number>;
    create(data: {
        order_id: string;
        filename: string;
        path: string;
        size: number;
        mime_type?: string;
        file_type?: FileType;
        uploaded_by?: string;
        uploaded_by_role?: string;
    }): Promise<File>;
    updateAnalysis(id: string, analysis: any): Promise<File>;
    approve(id: string): Promise<File>;
    reject(id: string, notes?: string): Promise<File>;
    setFinal(id: string): Promise<File>;
    findOne(id: string): Promise<File>;
    remove(id: string): Promise<void>;
}
