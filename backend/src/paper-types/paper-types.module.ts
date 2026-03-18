import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaperType } from './paper-type.entity';
import { PaperTypesService } from './paper-types.service';
import { PaperTypesController } from './paper-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaperType])],
  controllers: [PaperTypesController],
  providers: [PaperTypesService],
  exports: [PaperTypesService],
})
export class PaperTypesModule {}