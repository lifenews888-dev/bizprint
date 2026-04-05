import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { B2BCompany } from './entities/b2b-company.entity';
import { B2BMember } from './entities/b2b-member.entity';
import { B2BApprovalFlow } from './entities/b2b-approval-flow.entity';
import { B2BController } from './b2b.controller';
import { B2BService } from './b2b.service';

@Module({
  imports: [TypeOrmModule.forFeature([B2BCompany, B2BMember, B2BApprovalFlow])],
  controllers: [B2BController],
  providers: [B2BService],
  exports: [B2BService],
})
export class B2BModule {}
