import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { AiLayoutService, LayoutInput } from './ai-layout.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly service: TemplatesService,
    private readonly aiLayout: AiLayoutService,
  ) {}

  /** AI Auto Layout — generate design from user input */
  @Post('ai-layout')
  generateLayout(@Body() input: LayoutInput) {
    return this.aiLayout.generate(input)
  }

  @Get()
  findAll(@Query() query: any) {
    return this.service.findAll(query)
  }

  @Get('seed')
  @UseGuards(JwtAuthGuard)
  seed() {
    return this.service.seed()
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  findPending() {
    return this.service.findPending()
  }

  // Must be before :id to avoid route collision
  @Get('my/purchases')
  @UseGuards(JwtAuthGuard)
  getMyPurchases(@Request() req: any) {
    return this.service.getUserPurchases(req.user.id)
  }

  @Get('designer/:designerId')
  @UseGuards(JwtAuthGuard)
  findByDesigner(@Param('designerId') id: string) {
    return this.service.findByDesigner(id)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Get(':id/ownership')
  @UseGuards(JwtAuthGuard)
  checkOwnership(@Param('id') id: string, @Request() req: any) {
    return this.service.checkOwnership(id, req.user.id)
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  downloadTemplate(@Param('id') id: string, @Request() req: any) {
    return this.service.downloadTemplate(id, req.user.id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard)
  purchaseTemplate(@Param('id') id: string, @Request() req: any) {
    return this.service.purchaseTemplate(id, req.user.id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body)
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string) {
    return this.service.approve(id)
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Param('id') id: string) {
    return this.service.reject(id)
  }

  @Patch(':id/use')
  incrementUse(@Param('id') id: string) {
    return this.service.incrementUse(id)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
