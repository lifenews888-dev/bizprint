import { Global, Module } from '@nestjs/common'
import { PrinityOrderClient } from './prinity-order.client'

@Global()
@Module({
  providers: [PrinityOrderClient],
  exports: [PrinityOrderClient],
})
export class PrinityModule {}
