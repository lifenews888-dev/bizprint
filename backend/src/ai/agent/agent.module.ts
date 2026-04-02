import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { Order } from '../../orders/entities/order.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
