import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ProductVariant } from '../products/product-variant.entity'

@Injectable()
export class ProductVariantsService {

constructor(
@InjectRepository(ProductVariant)
private repository: Repository<ProductVariant>,
) {}

async create(data: Partial<ProductVariant>) {
const item = this.repository.create(data)
return this.repository.save(item)
}

async findAll() {
return this.repository.find({
relations: ['product', 'variant']
})
}

}
