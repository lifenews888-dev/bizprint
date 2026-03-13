import { Module } from '@nestjs/common'
import { GangRunController } from './gang-run.controller'
import { GangRunService } from './gang-run.service'

@Module({
  controllers: [GangRunController],
  providers: [GangRunService],
  exports: [GangRunService]
})
export class GangRunModule {}