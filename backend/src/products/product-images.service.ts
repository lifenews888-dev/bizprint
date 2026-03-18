import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from './product-image.entity';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private repo: Repository<ProductImage>,
  ) {}

  findByProduct(productId: string) {
    return this.repo.find({ where: { product_id: productId }, order: { sort_order: 'ASC', created_at: 'ASC' } });
  }

  create(data: Partial<ProductImage>) {
    const img = this.repo.create(data);
    return this.repo.save(img);
  }

  async setPrimary(id: string, productId: string) {
    await this.repo.update({ product_id: productId }, { is_primary: false });
    await this.repo.update(id, { is_primary: true });
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}