import { Order } from '../orders/entities/order.entity';
export declare enum FileStatus {
    UPLOADED = "uploaded",
    CHECKING = "checking",
    APPROVED = "approved",
    REJECTED = "rejected",
    NEEDS_FIX = "needs_fix"
}
export declare enum FileType {
    ORIGINAL = "original",
    DESIGN = "design",
    PREPRESS = "prepress",
    PRODUCTION = "production",
    QC = "qc",
    FINAL = "final"
}
export declare class File {
    id: string;
    order_id: string;
    order: Order;
    filename: string;
    path: string;
    size: number;
    version: number;
    file_type: FileType;
    status: FileStatus;
    is_final: boolean;
    uploaded_by: string;
    uploaded_by_role: string;
    mime_type: string;
    analysis: {
        pages?: number;
        dpi?: number;
        color_mode?: string;
        has_bleed?: boolean;
        bleed_mm?: number;
        width_mm?: number;
        height_mm?: number;
        fonts_embedded?: boolean;
        issues?: Array<{
            type: string;
            severity: string;
            message: string;
        }>;
        score?: number;
        risk?: string;
        summary?: string;
    };
    notes: string;
    created_at: Date;
    updated_at: Date;
}
