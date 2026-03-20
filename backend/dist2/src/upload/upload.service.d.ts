export declare class UploadService {
    processFile(file: Express.Multer.File): {
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
    };
}
