import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { MegaMenu } from './entities/mega-menu.entity';
import { HeroSlide } from './entities/hero-slide.entity';
import { SiteSettings } from './entities/site-settings.entity';
import { QuoteConfig } from './quote-config.entity';
import { QuoteConfigService } from './quote-config.service';
import { QuoteConfigController } from './quote-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MegaMenu, HeroSlide, SiteSettings, QuoteConfig])],
  controllers: [CmsController, QuoteConfigController],
  providers: [CmsService, QuoteConfigService],
  exports: [CmsService, QuoteConfigService],
})
export class CmsModule {}
