import { Module } from '@nestjs/common'
import { GangrunService } from './gangrun.service'
import { GangrunController } from './gangrun.controller'

@Module({
  controllers: [GangrunController],
  providers: [GangrunService]
})
export class GangrunModule {}