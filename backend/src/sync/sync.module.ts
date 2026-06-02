import { Module } from '@nestjs/common'
import { SyncGateway } from './sync.gateway'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from '../orders/entities/order.entity'
import { DesignRequest } from '../design-requests/design-request.entity'
import { Vendor } from '../vendors/vendor.entity'
import { OrderVendorGroup } from '../orders/entities/order-vendor-group.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, DesignRequest, Vendor, OrderVendorGroup]),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET
        const knownDefaults = ['bizprint_super_secret_key_2026', 'bizprint-bootstrap-2026', 'changeme', 'secret']
        if (!secret || secret.length < 24 || knownDefaults.includes(secret)) {
          throw new Error('JWT_SECRET environment variable must be set to a non-default value of at least 24 characters')
        }
        return { secret }
      },
    }),
  ],
  providers: [SyncGateway],
  exports:   [SyncGateway],
})
export class SyncModule {}
