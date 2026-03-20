import { ProductImagesService } from './product-images.service';
import { UploadService } from '../upload/upload.service';
export declare class ProductImagesController {
    private svc;
    private uploadSvc;
    constructor(svc: ProductImagesService, uploadSvc: UploadService);
    findAll(productId: string): any[] | Promise<import("./product-image.entity").ProductImage[]>;
    upload(file: Express.Multer.File, productId: string, alt: string, sortOrder: string): Promise<{
        error: string;
        success?: undefined;
        original_name?: undefined;
        saved_as?: undefined;
        size_mb?: undefined;
        mimetype?: undefined;
        file_url?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        original_name: string;
        saved_as: string;
        size_mb: string;
        mimetype: string;
        file_url: string;
        message: string;
        error?: undefined;
    } | import("./product-image.entity").ProductImage>;
    setPrimary(id: string, productId: string): Promise<import("./product-image.entity").ProductImage>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
