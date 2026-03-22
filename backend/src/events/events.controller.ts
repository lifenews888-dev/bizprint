import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsLogService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsLogService) {}

  @Get()
  getRecent(@Query('limit') limit?: string) {
    return this.service.findRecent(limit ? Number(limit) : 100);
  }

  @Get(':entity_type')
  getByType(
    @Param('entity_type') entity_type: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findByType(entity_type, limit ? Number(limit) : 50);
  }

  @Get(':entity_type/:entity_id')
  getByEntity(
    @Param('entity_type') entity_type: string,
    @Param('entity_id') entity_id: string,
  ) {
    return this.service.findByEntity(entity_type, entity_id);
  }
}
