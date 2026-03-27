import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CapacityController } from './capacity.controller';
import { CapacityService } from './capacity.service';
import { ProductVendor } from '../vendors/entities/product-vendor.entity';
import { Vendor } from '../vendors/vendor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductVendor, Vendor])],
  controllers: [CapacityController],
  providers: [CapacityService],
  exports: [CapacityService],
})
export class CapacityModule {}
