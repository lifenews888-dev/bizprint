import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DesignRequest } from './design-request.entity'
import { DesignRequestsService } from './design-requests.service'
import { DesignRequestsController } from './design-requests.controller'
import { MailModule } from '../mail/mail.module'
import { WalletModule } from '../wallet/wallet.module'
import { SettingsModule } from '../settings/settings.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([DesignRequest]),
    MailModule,
    WalletModule,
    SettingsModule,
  ],
  controllers: [DesignRequestsController],
  providers: [DesignRequestsService],
  exports: [DesignRequestsService],
})
export class DesignRequestsModule {}
