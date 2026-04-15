import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './vendor.entity';
import { Capability } from './entities/capability.entity';
import { VendorCapability } from './entities/vendor-capability.entity';
import { ProductVendor } from './entities/product-vendor.entity';
import { VendorMetrics } from './entities/vendor-metrics.entity';
import { OrderVendorGroup } from '../orders/entities/order-vendor-group.entity';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { AssignmentEngineService } from './services/assignment-engine.service';
import { VendorTierService } from './services/vendor-tier.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      Capability,
      VendorCapability,
      ProductVendor,
      VendorMetrics,
      OrderVendorGroup,
    ]),
    CloudinaryModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService, AssignmentEngineService, VendorTierService],
  exports: [VendorsService, AssignmentEngineService, VendorTierService],
})
export class VendorsModule {}