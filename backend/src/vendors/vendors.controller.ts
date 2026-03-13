import { Controller, Post, Body, Get } from '@nestjs/common';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  create(@Body() body: any) {
    return this.vendorsService.create(body);
  }

  @Get()
  findAll() {
    return this.vendorsService.findAll();
  }
}