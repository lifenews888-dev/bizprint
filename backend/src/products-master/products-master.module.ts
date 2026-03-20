import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductMaster } from './entities/product-master.entity'
import { ProductMaterial } from './entities/product-material.entity'
import { ProductSizeOption } from './entities/product-size-option.entity'
import { ProductFinishing } from './entities/product-finishing.entity'
import { ProductAddon } from './entities/product-addon.entity'
import { ProductsMasterService } from './products-master.service'
import { ProductsMasterController } from './products-master.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ProductMaster, ProductMaterial, ProductSizeOption, ProductFinishing, ProductAddon])],
  controllers: [ProductsMasterController],
  providers: [ProductsMasterService],
  exports: [ProductsMasterService],
})
export class ProductsMasterModule {}
