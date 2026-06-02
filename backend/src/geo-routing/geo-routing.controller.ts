import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GeoRoutingService, UB_DISTRICTS } from './geo-routing.service';

@ApiTags('Geo Routing')
@Controller('geo')
export class GeoRoutingController {
  constructor(private readonly geoSvc: GeoRoutingService) {}

  @Post('nearest-vendors')
  @ApiOperation({ summary: 'Хамгийн ойр үйлдвэрүүд олох' })
  findNearest(@Body() body: {
    lat: number;
    lng: number;
    productType?: string;
    quantity?: number;
    strategy?: string;
    maxDistanceKm?: number;
    includeUnlocated?: boolean;
  }) {
    return this.geoSvc.findNearestVendors(
      { lat: body.lat, lng: body.lng },
      {
        productType: body.productType,
        quantity: body.quantity,
        strategy: (body.strategy as any) || 'best_score',
        maxDistanceKm: body.maxDistanceKm,
        includeUnlocated: body.includeUnlocated,
      },
    );
  }

  @Post('distance')
  @ApiOperation({ summary: 'Хоёр цэгийн зай тооцоолох' })
  calcDistance(@Body() body: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
  }) {
    const distance = this.geoSvc.calculateDistance(body.from, body.to);
    const cost = this.geoSvc.calcDeliveryCost(distance, 0, 500, 5);
    return {
      distanceKm: Math.round(distance * 10) / 10,
      deliveryCost: cost,
      isFreeDelivery: cost === 0,
      estimatedHours: this.geoSvc.estimateDeliveryTime(distance, 24),
    };
  }

  @Get('districts')
  @ApiOperation({ summary: 'Дүүргүүдийн координат' })
  getDistricts() {
    return Object.entries(UB_DISTRICTS).map(([name, coords]) => ({
      name,
      ...coords,
    }));
  }

  @Post('auto-assign')
  @ApiOperation({ summary: 'Захиалгад автомат vendor assign' })
  autoAssign(@Body() body: {
    orderId: string;
    lat: number;
    lng: number;
    productType: string;
    quantity: number;
  }) {
    return this.geoSvc.autoAssignVendor(
      body.orderId, body.lat, body.lng, body.productType, body.quantity,
    );
  }
}
