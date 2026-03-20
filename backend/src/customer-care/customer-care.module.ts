import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CustomerProfile } from './entities/customer-profile.entity'
import { CustomerInteraction } from './entities/customer-interaction.entity'
import { SupportTicket } from './entities/support-ticket.entity'
import { CustomerCareService } from './customer-care.service'
import { CustomerCareController } from './customer-care.controller'

@Module({
  imports: [TypeOrmModule.forFeature([CustomerProfile, CustomerInteraction, SupportTicket])],
  controllers: [CustomerCareController],
  providers: [CustomerCareService],
  exports: [CustomerCareService],
})
export class CustomerCareModule {}
