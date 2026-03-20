import { FilesService } from './files.service';
import { FileType } from './file.entity';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    findAll(orderId: string): Promise<import("./file.entity").File[]>;
    findFinal(orderId: string): Promise<import("./file.entity").File>;
    findOne(id: string): Promise<import("./file.entity").File>;
    create(body: {
        order_id: string;
        filename: string;
        path: string;
        size: number;
        mime_type?: string;
        file_type?: FileType;
        uploaded_by?: string;
        uploaded_by_role?: string;
    }): Promise<import("./file.entity").File>;
    updateAnalysis(id: string, body: {
        analysis: any;
    }): Promise<import("./file.entity").File>;
    approve(id: string): Promise<import("./file.entity").File>;
    reject(id: string, body: {
        notes?: string;
    }): Promise<import("./file.entity").File>;
    setFinal(id: string): Promise<import("./file.entity").File>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
