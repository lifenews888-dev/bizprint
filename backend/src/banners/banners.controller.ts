import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BannersService } from './banners.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  // Нийтийн - зөвхөн идэвхтэй баннерууд
  @Get('active')
  getActive() {
    return this.service.findActive();
  }

  // Admin - бүгд
  @Get()
  @UseGuards(AdminGuard)
  getAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}