import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalCard } from './entities/digital-card.entity';
import { QrSubscription } from './entities/qr-subscription.entity';
import { DigitalCardController } from './digital-card.controller';
import { DigitalCardService } from './digital-card.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DigitalCard, QrSubscription]),
    SettingsModule,
  ],
  controllers: [DigitalCardController],
  providers: [DigitalCardService],
  exports: [DigitalCardService],
})
export class DigitalCardModule {}
