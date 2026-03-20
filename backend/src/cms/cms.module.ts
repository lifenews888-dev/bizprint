import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SiteSettings } from './entities/site-settings.entity'
import { MegaMenu } from './entities/mega-menu.entity'
import { CmsService } from './cms.service'
import { CmsController } from './cms.controller'
import { CmsGateway } from './cms.gateway'

@Module({
  imports: [TypeOrmModule.forFeature([SiteSettings, MegaMenu])],
  controllers: [CmsController],
  providers: [CmsService, CmsGateway],
  exports: [CmsService],
})
export class CmsModule {}
