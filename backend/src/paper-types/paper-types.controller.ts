import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PaperTypesService } from './paper-types.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('paper-types')
export class PaperTypesController {
  constructor(private svc: PaperTypesService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get('active')
  findActive() { return this.svc.findActive(); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) { return this.svc.create(body); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}