import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('system')
export class SystemReadinessController {
  constructor(private readonly svc: SystemService) {}

  @Get('readiness')
  readiness() {
    return this.svc.getReadiness();
  }
}
