import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { SystemReadinessController } from './system-readiness.controller';
import { SystemService } from './system.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [SystemController, SystemReadinessController],
  providers: [SystemService],
})
export class SystemModule {}
