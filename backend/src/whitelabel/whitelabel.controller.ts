import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { WhitelabelService } from './whitelabel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('whitelabel')
export class WhitelabelController {
  constructor(private svc: WhitelabelService) {}

  // Public: get config by subdomain
  @Get('config/:subdomain')
  getConfig(@Param('subdomain') subdomain: string) {
    return this.svc.findBySubdomain(subdomain);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }
}
