import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './template.entity';
import { TemplatePurchase } from './template-purchase.entity';
import { TemplatesService } from './templates.service';
import { AiLayoutService } from './ai-layout.service';
import { TemplatesController } from './templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Template, TemplatePurchase])],
  providers: [TemplatesService, AiLayoutService],
  controllers: [TemplatesController],
  exports: [TemplatesService, AiLayoutService],
})
export class TemplatesModule {}
