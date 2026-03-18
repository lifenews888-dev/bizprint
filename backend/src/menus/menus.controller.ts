import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MenusService } from './menus.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('menus')
export class MenusController {
  constructor(private readonly service: MenusService) {}

  @Get('location/:location')
  getByLocation(@Param('location') location: string) {
    return this.service.findByLocation(location);
  }

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  bulkUpdate(@Body() body: any[]) {
    return this.service.bulkUpdate(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}