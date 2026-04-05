import { Module } from '@nestjs/common';
import { PrepressController } from './prepress.controller';
import { PdfInspectorModule } from '../pdf-inspector/pdf-inspector.module';

@Module({
  imports: [PdfInspectorModule],
  controllers: [PrepressController],
})
export class PrepressModule {}
