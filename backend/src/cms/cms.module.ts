import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SiteSettings } from './entities/site-settings.entity'
import { MegaMenu } from './entities/mega-menu.entity'
import { CmsService } from './cms.service'
import { CmsController } from './cms.controller'

@Module({
  imports: [TypeOrmModule.forFeature([SiteSettings, MegaMenu])],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
