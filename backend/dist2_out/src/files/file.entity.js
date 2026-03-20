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
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = exports.FileType = exports.FileStatus = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("../orders/entities/order.entity");
var FileStatus;
(function (FileStatus) {
    FileStatus["UPLOADED"] = "uploaded";
    FileStatus["CHECKING"] = "checking";
    FileStatus["APPROVED"] = "approved";
    FileStatus["REJECTED"] = "rejected";
    FileStatus["NEEDS_FIX"] = "needs_fix";
})(FileStatus || (exports.FileStatus = FileStatus = {}));
var FileType;
(function (FileType) {
    FileType["ORIGINAL"] = "original";
    FileType["DESIGN"] = "design";
    FileType["PREPRESS"] = "prepress";
    FileType["PRODUCTION"] = "production";
    FileType["QC"] = "qc";
    FileType["FINAL"] = "final";
})(FileType || (exports.FileType = FileType = {}));
let File = class File {
};
exports.File = File;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], File.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], File.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_entity_1.Order)
], File.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], File.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], File.prototype, "path", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], File.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], File.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FileType,
        default: FileType.ORIGINAL,
    }),
    __metadata("design:type", String)
], File.prototype, "file_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FileStatus,
        default: FileStatus.UPLOADED,
    }),
    __metadata("design:type", String)
], File.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], File.prototype, "is_final", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], File.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], File.prototype, "uploaded_by_role", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], File.prototype, "mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], File.prototype, "analysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], File.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], File.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], File.prototype, "updated_at", void 0);
exports.File = File = __decorate([
    (0, typeorm_1.Entity)('files')
], File);
//# sourceMappingURL=file.entity.js.map