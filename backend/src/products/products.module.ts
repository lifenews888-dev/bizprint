import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { ProductsService } from './products.service';
import { ProductPriceCalculatorService } from './product-price-calculator.service';
import { ProductsController, VendorStoreController, AdminShopProductsController } from './products.controller';
import { ProductsMasterModule } from '../products-master/products-master.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage])],
  controllers: [ProductsController, VendorStoreController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
