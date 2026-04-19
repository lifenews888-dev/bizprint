import { Module } from '@nestjs/common';
import { ConfigMobileController } from './config-mobile.controller';
import { ConfigMobileService } from './config-mobile.service';

@Module({
  controllers: [ConfigMobileController],
  providers: [ConfigMobileService],
  exports: [ConfigMobileService],
})
export class ConfigMobileModule {}
