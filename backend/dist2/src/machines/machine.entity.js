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
exports.Machine = exports.MachineStatus = void 0;
const typeorm_1 = require("typeorm");
var MachineStatus;
(function (MachineStatus) {
    MachineStatus["AVAILABLE"] = "available";
    MachineStatus["BUSY"] = "busy";
    MachineStatus["MAINTENANCE"] = "maintenance";
})(MachineStatus || (exports.MachineStatus = MachineStatus = {}));
let Machine = class Machine {
};
exports.Machine = Machine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Machine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Machine.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Machine.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Machine.prototype, "speed_per_hour", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Machine.prototype, "sheet_width_mm", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Machine.prototype, "sheet_height_mm", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Machine.prototype, "hour_rate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Machine.prototype, "factory_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: MachineStatus,
        default: MachineStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], Machine.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Machine.prototype, "created_at", void 0);
exports.Machine = Machine = __decorate([
    (0, typeorm_1.Entity)('machine')
], Machine);
//# sourceMappingURL=machine.entity.js.map