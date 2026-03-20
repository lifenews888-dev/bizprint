import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AuditTrailService } from './audit-trail.service';

@Controller('audit-trail')
export class AuditTrailController {
  constructor(private service: AuditTrailService) {}

  @Post()
  create(@Body() body: { order_id: string; user: string; action: string; file?: string }) {
    return this.service.create(body);
  }

  @Post('bulk')
  bulkCreate(@Body() body: { entries: { order_id: string; user: string; action: string; file?: string }[] }) {
    return this.service.bulkCreate(body.entries);
  }

  @Get(':orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.service.getByOrderId(orderId);
  }
}
