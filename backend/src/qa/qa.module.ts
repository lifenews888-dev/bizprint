import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QaCheckpoint } from './entities/qa-checkpoint.entity';
import { PrintPassport } from './entities/print-passport.entity';
import { NonConformanceLog } from './entities/non-conformance-log.entity';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';

@Module({
  imports: [TypeOrmModule.forFeature([QaCheckpoint, PrintPassport, NonConformanceLog])],
  controllers: [QaController],
  providers: [QaService],
  exports: [QaService],
})
export class QaModule {}
