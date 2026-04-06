import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { EventBusService } from './event-bus.service'
import { EventsLogService } from './events.service'
import { EventsController } from './events.controller'
import { Event } from './entities/event.entity'

/**
 * @Global — EventBusService + EventsLogService + EventEmitter2 available in every module.
 */
@Global()
@Module({
  imports: [EventEmitterModule.forRoot(), TypeOrmModule.forFeature([Event])],
  controllers: [EventsController],
  providers: [EventBusService, EventsLogService],
  exports:   [EventBusService, EventsLogService],
})
export class EventsModule {}
