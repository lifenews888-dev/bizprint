import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { File } from './file.entity'
import { FilesService } from './files.service'
import { FilesController } from './files.controller'
import { ProductionGateService } from './production-gate.service'
import { PdfInspectorModule } from '../ai/pdf-inspector/pdf-inspector.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    PdfInspectorModule,
  ],
  controllers: [FilesController],
  providers: [FilesService, ProductionGateService],
  exports: [FilesService, ProductionGateService],
})
export class FilesModule {}
