import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProofVersion } from './entities/proof-version.entity';
import { ProofingController } from './proofing.controller';
import { ProofingService } from './proofing.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProofVersion])],
  controllers: [ProofingController],
  providers: [ProofingService],
  exports: [ProofingService],
})
export class ProofingModule {}
