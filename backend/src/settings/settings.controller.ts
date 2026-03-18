import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get('public')
  getPublic() {
    return this.service.getAll();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.service.getAll();
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  bulkSet(@Body() data: Record<string, string>) {
    return this.service.bulkSet(data);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  set(@Body() body: { key: string; value: string; type?: string; label?: string }) {
    return this.service.set(body.key, body.value, body.type, body.label);
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard)
  delete(@Param('key') key: string) {
    return this.service.delete(key);
  }
}