import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaperStock } from './entities/paper-stock.entity';
import { InkProfile } from './entities/ink-profile.entity';
import { FinishingOption } from './entities/finishing-option.entity';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaperStock, InkProfile, FinishingOption])],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
