import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductQrController } from './product-qr.controller';
import { ProductQrService } from './product-qr.service';
import { ProductQr } from './entities/product-qr.entity';
import { ProductReview } from './entities/product-review.entity';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductQr, ProductReview]),
    SubscriptionModule,
  ],
  controllers: [ProductQrController],
  providers: [ProductQrService],
  exports: [ProductQrService],
})
export class ProductQrModule {}
