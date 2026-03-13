import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Variant } from './variant.entity'
import { VariantsController } from './variants.controller'
import { VariantsService } from './variants.service'

@Module({
imports: [TypeOrmModule.forFeature([Variant])],
controllers: [VariantsController],
providers: [VariantsService],
})
export class VariantsModule {}
