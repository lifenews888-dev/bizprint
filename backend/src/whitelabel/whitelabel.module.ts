import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhitelabelConfig } from './whitelabel.entity';
import { WhitelabelService } from './whitelabel.service';
import { WhitelabelController } from './whitelabel.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WhitelabelConfig])],
  controllers: [WhitelabelController],
  providers: [WhitelabelService],
  exports: [WhitelabelService],
})
export class WhitelabelModule {}
