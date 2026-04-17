import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { ProductsService } from './products.service';
import { ProductsController, VendorStoreController } from './products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage])],
  controllers: [ProductsController, VendorStoreController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
