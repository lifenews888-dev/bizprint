import { CartService } from './cart.service';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(userId: string): Promise<import("./cart.entity").Cart>;
    addItem(body: any): Promise<import("./entities/cart-item.entity").CartItem>;
    removeItem(id: string): Promise<import("typeorm").DeleteResult>;
}
