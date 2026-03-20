import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditTrail } from './audit-trail.entity';
import { AuditTrailService } from './audit-trail.service';
import { AuditTrailController } from './audit-trail.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditTrail])],
  controllers: [AuditTrailController],
  providers: [AuditTrailService],
  exports: [AuditTrailService],
})
export class AuditTrailModule {}
