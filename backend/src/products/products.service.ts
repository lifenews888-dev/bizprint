import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  create(data: Partial<Product>) {
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  findAll() {
    return this.productRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', created_at: 'DESC' },
    });
  }

  findOne(id: string) {
    return this.productRepo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Product>) {
    await this.productRepo.update(id, data);
    return this.findOne(id);
  }
}