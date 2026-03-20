import { Cart } from '../cart.entity';
export declare class CartItem {
    id: string;
    product_id: string;
    quantity: number;
    cart: Cart;
}
