import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { ExcelProductsService } from './excel-products.service';
import { ExcelProductsController } from './excel-products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ExcelProductsController],
  providers: [ExcelProductsService],
  exports: [ExcelProductsService],
})
export class ExcelProductsModule {}
