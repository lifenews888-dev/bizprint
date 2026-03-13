import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Variant } from './variant.entity'

@Injectable()
export class VariantsService {

constructor(
@InjectRepository(Variant)
private variantRepository: Repository<Variant>,
) {}

async create(data: Partial<Variant>) {
const variant = this.variantRepository.create(data)
return this.variantRepository.save(variant)
}

async findAll() {
return this.variantRepository.find()
}
}
