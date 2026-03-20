import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { ProductsController, VendorStoreController } from './products.controller';
import { ProductsMasterModule } from '../products-master/products-master.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), ProductsMasterModule],
  controllers: [ProductsController, VendorStoreController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
