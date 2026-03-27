import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly service: MarketingService) {}

  @Get('campaigns')
  findAll() {
    return this.service.findAll();
  }

  @Post('campaigns')
  @UseGuards(AdminGuard)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch('campaigns/:id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete('campaigns/:id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
