import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DesignRequestsService } from './design-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('design-requests')
export class DesignRequestsController {
  constructor(private svc: DesignRequestsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() { return this.svc.findAll() }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  findPending() { return this.svc.findPending() }

  @Get('designer/:id')
  @UseGuards(JwtAuthGuard)
  findByDesigner(@Param('id') id: string) { return this.svc.findByDesigner(id) }

  @Get('customer/:id')
  @UseGuards(JwtAuthGuard)
  findByCustomer(@Param('id') id: string) { return this.svc.findByCustomer(id) }

  @Get('order/:id')
  @UseGuards(JwtAuthGuard)
  findByOrder(@Param('id') id: string) { return this.svc.findByOrder(id) }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) { return this.svc.findOne(id) }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) { return this.svc.create(body) }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  assign(@Param('id') id: string, @Body() body: any) {
    return this.svc.assign(id, body.designer_id, body.designer_name, body.designer_phone, body.designer_zoom)
  }

  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard)
  submit(@Param('id') id: string, @Body() body: any) {
    return this.svc.submitFile(id, body.file_url, body.preview_url)
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string) { return this.svc.approve(id) }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Param('id') id: string, @Body() body: any) { return this.svc.reject(id, body.reason) }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.svc.remove(id) }
}