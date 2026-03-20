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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./product.entity");
let ProductsService = class ProductsService {
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    create(data) {
        const product = this.productRepo.create(data);
        return this.productRepo.save(product);
    }
    async findAll(categoryId) {
        if (!categoryId) {
            return this.productRepo.find({ where: { is_active: true }, order: { sort_order: 'ASC', created_at: 'DESC' } });
        }
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
        if (isUuid) {
            return this.productRepo.query(`SELECT p.* FROM products p JOIN categories c ON c.slug = p.category WHERE c.id = $1 AND p.is_active = true ORDER BY p.sort_order ASC`, [categoryId]);
        }
        return this.productRepo.find({ where: { is_active: true, category: categoryId }, order: { sort_order: 'ASC', created_at: 'DESC' } });
    }
    findOne(id) {
        return this.productRepo.findOne({ where: { id } });
    }
    async update(id, data) {
        await this.productRepo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.productRepo.delete(id);
        return { deleted: true };
    }
    findByVendor(vendorId) {
        return this.productRepo.find({
            where: { vendor_id: vendorId },
            order: { created_at: 'DESC' },
        });
    }
    async createForVendor(vendorId, data) {
        const slug = `${data.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const product = this.productRepo.create({
            ...data,
            vendor_id: vendorId,
            slug: data.slug || slug,
            name_mn: data.name_mn || data.name || '',
        });
        return this.productRepo.save(product);
    }
    async updateForVendor(vendorId, id, data) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        if (product.vendor_id !== vendorId)
            throw new common_1.ForbiddenException('Not your product');
        await this.productRepo.update(id, data);
        return this.findOne(id);
    }
    async removeForVendor(vendorId, id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        if (product.vendor_id !== vendorId)
            throw new common_1.ForbiddenException('Not your product');
        await this.productRepo.delete(id);
        return { deleted: true };
    }
    async getVendorOrderStats(vendorId) {
        const result = await this.productRepo.query(`SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_revenue,
        COUNT(DISTINCT p.id) as total_products
       FROM products p
       LEFT JOIN orders o ON o.product_id = p.id
       WHERE p.vendor_id = $1`, [vendorId]);
        return result[0] || { total_orders: 0, total_revenue: 0, total_products: 0 };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map