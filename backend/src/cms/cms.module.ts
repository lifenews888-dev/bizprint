import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { MegaMenu } from './entities/mega-menu.entity';
import { HeroSlide } from './entities/hero-slide.entity';
import { SiteSettings } from './entities/site-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MegaMenu, HeroSlide, SiteSettings])],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
