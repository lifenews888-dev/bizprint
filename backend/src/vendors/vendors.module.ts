import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './vendor.entity';
import { Capability } from './entities/capability.entity';
import { VendorCapability } from './entities/vendor-capability.entity';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor, Capability, VendorCapability])],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule {}