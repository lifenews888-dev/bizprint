import { CartItem } from './entities/cart-item.entity';
export declare enum CartStatus {
    ACTIVE = "active",
    CHECKED_OUT = "checked_out",
    EXPIRED = "expired"
}
export declare class Cart {
    id: string;
    customer_id: string;
    status: CartStatus;
    items: CartItem[];
}
