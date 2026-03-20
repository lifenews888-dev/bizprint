export declare enum DesignStatus {
    PENDING = "pending",
    ASSIGNED = "assigned",
    IN_PROGRESS = "in_progress",
    REVIEW = "review",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class DesignRequest {
    id: string;
    order_id: string;
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    designer_id: string;
    designer_name: string;
    designer_phone: string;
    designer_zoom: string;
    status: string;
    product_name: string;
    requirements: string;
    file_url: string;
    preview_url: string;
    notes: string;
    reject_reason: string;
    deadline: Date;
    design_fee: number;
    created_at: Date;
    updated_at: Date;
}
