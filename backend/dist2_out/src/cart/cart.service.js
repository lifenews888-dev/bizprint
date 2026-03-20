"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cart_entity_1 = require("./cart.entity");
const cart_item_entity_1 = require("./entities/cart-item.entity");
let CartService = class CartService {
    constructor(cartRepo, itemRepo) {
        this.cartRepo = cartRepo;
        this.itemRepo = itemRepo;
    }
    async getCart(userId) {
        return this.cartRepo.findOne({
            where: { customer_id: userId },
            relations: ['items'],
        });
    }
    async addItem(userId, data) {
        let cart = await this.cartRepo.findOne({
            where: { customer_id: userId }
        });
        if (!cart) {
            cart = await this.cartRepo.save({
                customer_id: userId
            });
        }
        const item = this.itemRepo.create({
            product_id: data.product_id,
            quantity: data.quantity,
            cart: cart
        });
        return this.itemRepo.save(item);
    }
    async removeItem(id) {
        return this.itemRepo.delete(id);
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(1, (0, typeorm_1.InjectRepository)(cart_item_entity_1.CartItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CartService);
//# sourceMappingURL=cart.service.js.map