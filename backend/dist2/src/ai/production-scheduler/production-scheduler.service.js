"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionSchedulerService = void 0;
const common_1 = require("@nestjs/common");
let ProductionSchedulerService = class ProductionSchedulerService {
    scheduleOrders(orders) {
        let currentTime = 0;
        const schedule = [];
        for (const order of orders) {
            const duration = Math.ceil(order.quantity / order.machine_speed);
            const start = currentTime;
            const end = start + duration;
            schedule.push({
                order_id: order.id,
                machine_speed: order.machine_speed,
                start_time: this.formatTime(start),
                end_time: this.formatTime(end)
            });
            currentTime = end;
        }
        return {
            total_orders: orders.length,
            schedule
        };
    }
    formatTime(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
};
exports.ProductionSchedulerService = ProductionSchedulerService;
exports.ProductionSchedulerService = ProductionSchedulerService = __decorate([
    (0, common_1.Injectable)()
], ProductionSchedulerService);
//# sourceMappingURL=production-scheduler.service.js.map