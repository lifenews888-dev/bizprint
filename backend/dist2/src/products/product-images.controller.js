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
exports.ProductImagesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const product_images_service_1 = require("./product-images.service");
const upload_service_1 = require("../upload/upload.service");
let ProductImagesController = class ProductImagesController {
    constructor(svc, uploadSvc) {
        this.svc = svc;
        this.uploadSvc = uploadSvc;
    }
    findAll(productId) {
        if (!productId)
            return [];
        return this.svc.findByProduct(productId);
    }
    async upload(file, productId, alt, sortOrder) {
        const uploaded = this.uploadSvc.processFile(file);
        if (!uploaded.success)
            return uploaded;
        return this.svc.create({
            product_id: productId,
            url: 'http://localhost:4000' + uploaded.file_url,
            alt: alt || '',
            sort_order: Number(sortOrder) || 0,
            is_primary: false,
        });
    }
    setPrimary(id, productId) {
        return this.svc.setPrimary(id, productId);
    }
    remove(id) {
        return this.svc.remove(id);
    }
};
exports.ProductImagesController = ProductImagesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('product_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductImagesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('product_id')),
    __param(2, (0, common_1.Body)('alt')),
    __param(3, (0, common_1.Body)('sort_order')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ProductImagesController.prototype, "upload", null);
__decorate([
    (0, common_1.Patch)(':id/primary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('product_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductImagesController.prototype, "setPrimary", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductImagesController.prototype, "remove", null);
exports.ProductImagesController = ProductImagesController = __decorate([
    (0, common_1.Controller)('product-images'),
    __metadata("design:paramtypes", [product_images_service_1.ProductImagesService,
        upload_service_1.UploadService])
], ProductImagesController);
//# sourceMappingURL=product-images.controller.js.map