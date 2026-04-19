import { Controller, Get } from '@nestjs/common';
import { ConfigMobileService, MobileConfigResponse } from './config-mobile.service';

@Controller('config')
export class ConfigMobileController {
  constructor(private readonly service: ConfigMobileService) {}

  // Public — mobile app reads this on boot, no auth required.
  @Get('mobile')
  getMobile(): MobileConfigResponse {
    return this.service.getConfig();
  }
}
