import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ProductionJob } from './entities/production-job.entity'
import { ProductionService } from './production.service'
import { ProductionController } from './production.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ProductionJob])],
  providers: [ProductionService],
  controllers: [ProductionController]
})
export class ProductionModule {}