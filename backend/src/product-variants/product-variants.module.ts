import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ProductVariant } from '../products/product-variant.entity'
import { ProductVariantsService } from './product-variants.service'
import { ProductVariantsController } from './product-variants.controller'

@Module({
imports: [TypeOrmModule.forFeature([ProductVariant])],
controllers: [ProductVariantsController],
providers: [ProductVariantsService],
})
export class ProductVariantsModule {}
