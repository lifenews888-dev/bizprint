import { Module } from '@nestjs/common';
import { SheetOptimizerController } from './sheet-optimizer.controller';
import { SheetOptimizerService } from './sheet-optimizer.service';

@Module({
  controllers: [SheetOptimizerController],
  providers: [SheetOptimizerService]
})
export class SheetOptimizerModule {}
