import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttribute } from './product-attribute.entity';

@Injectable()
export class ProductAttributesService {
  constructor(
    @InjectRepository(ProductAttribute)
    private repo: Repository<ProductAttribute>,
  ) {}

  findByProduct(productId: string) {
    return this.repo.find({ where: { product_id: productId }, order: { sort_order: 'ASC' } });
  }

  create(data: Partial<ProductAttribute>) {
    const attr = this.repo.create(data);
    return this.repo.save(attr);
  }

  async update(id: string, data: Partial<ProductAttribute>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}