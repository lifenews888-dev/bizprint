import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentItem } from './entities/shipment-item.entity';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentItem)
    private readonly itemRepo: Repository<ShipmentItem>,
  ) {}

  async findByOrder(order_id: string) {
    return this.shipmentRepo.find({
      where: { order_id },
      relations: ['shipment_items'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string) {
    const shipment = await this.shipmentRepo.findOne({
      where: { id },
      relations: ['shipment_items'],
    });
    if (!shipment) throw new NotFoundException('Shipment олдсонгүй');
    return shipment;
  }

  async create(data: Partial<Shipment>) {
    const shipment = this.shipmentRepo.create(data);
    return this.shipmentRepo.save(shipment);
  }

  async updateStatus(id: string, status: string) {
    await this.shipmentRepo.update(id, { status: status as any });
    return this.findOne(id);
  }

  async addItem(data: Partial<ShipmentItem>) {
    const item = this.itemRepo.create(data);
    return this.itemRepo.save(item);
  }
}
