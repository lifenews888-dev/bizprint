import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ProductionJob } from './entities/production-job.entity'
import { ProductionStage } from './entities/production-stage.entity'
import { ProductionService } from './production.service'
import { ProductionController } from './production.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ProductionJob, ProductionStage])],
  providers: [ProductionService],
  controllers: [ProductionController],
  exports: [ProductionService],
})
export class ProductionModule {}