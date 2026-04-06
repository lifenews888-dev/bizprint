import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from '../vendors/vendor.entity';
import { GeoRoutingController } from './geo-routing.controller';
import { GeoRoutingService } from './geo-routing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor])],
  controllers: [GeoRoutingController],
  providers: [GeoRoutingService],
  exports: [GeoRoutingService],
})
export class GeoRoutingModule {}
