import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './entities/cart-item.entity';
export declare class CartService {
    private cartRepo;
    private itemRepo;
    constructor(cartRepo: Repository<Cart>, itemRepo: Repository<CartItem>);
    getCart(userId: string): Promise<Cart>;
    addItem(userId: string, data: any): Promise<CartItem>;
    removeItem(id: string): Promise<import("typeorm").DeleteResult>;
}
