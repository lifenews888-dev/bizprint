import { Injectable } from '@nestjs/common'

@Injectable()
export class ProductionSchedulerService {

  scheduleOrders(orders: any[]) {

    let currentTime = 0
    const schedule: any[] = []

    for (const order of orders) {

      const duration = Math.ceil(order.quantity / order.machine_speed)

      const start = currentTime
      const end = start + duration

      schedule.push({
        order_id: order.id,
        machine_speed: order.machine_speed,
        start_time: this.formatTime(start),
        end_time: this.formatTime(end)
      })

      currentTime = end
    }

    return {
      total_orders: orders.length,
      schedule
    }

  }

  private formatTime(minutes: number) {

    const h = Math.floor(minutes / 60)
    const m = minutes % 60

    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  }

}