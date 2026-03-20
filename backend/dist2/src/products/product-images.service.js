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
exports.ProductImagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_image_entity_1 = require("./product-image.entity");
let ProductImagesService = class ProductImagesService {
    constructor(repo) {
        this.repo = repo;
    }
    findByProduct(productId) {
        return this.repo.find({ where: { product_id: productId }, order: { sort_order: 'ASC', created_at: 'ASC' } });
    }
    create(data) {
        const img = this.repo.create(data);
        return this.repo.save(img);
    }
    async setPrimary(id, productId) {
        await this.repo.update({ product_id: productId }, { is_primary: false });
        await this.repo.update(id, { is_primary: true });
        return this.repo.findOne({ where: { id } });
    }
    async remove(id) {
        await this.repo.delete(id);
        return { deleted: true };
    }
};
exports.ProductImagesService = ProductImagesService;
exports.ProductImagesService = ProductImagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_image_entity_1.ProductImage)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductImagesService);
//# sourceMappingURL=product-images.service.js.map