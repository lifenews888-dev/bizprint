import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PricingConfigService } from './pricing-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pricing-config')
export class PricingConfigController {
  constructor(private svc: PricingConfigService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(@Query('category') category?: string) {
    return category ? this.svc.getByCategory(category) : this.svc.getAll();
  }

  @Get('public')
  getPublic() {
    return this.svc.getPublic();
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard)
  async update(@Param('key') key: string, @Body() body: { value: number }) {
    await this.svc.set(key, Number(body.value));
    return { updated: true };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async bulkUpdate(@Body() body: { items: { key: string; value: number }[] }) {
    await this.svc.bulkSet(body.items);
    return { updated: body.items.length };
  }
}
