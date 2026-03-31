import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MegaMenuController } from './mega-menu.controller';
import { MegaMenuService } from './mega-menu.service';
import { MegaMenuV2, MenuColumn, MenuCategory, MenuItemEntity, PromoBlock } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([MegaMenuV2, MenuColumn, MenuCategory, MenuItemEntity, PromoBlock]),
  ],
  controllers: [MegaMenuController],
  providers: [MegaMenuService],
  exports: [MegaMenuService],
})
export class MegaMenuModule {}
