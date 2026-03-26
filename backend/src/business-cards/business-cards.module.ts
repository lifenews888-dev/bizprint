import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BcProduct } from './entities/bc-product.entity';
import { BcLayout } from './entities/bc-layout.entity';
import { BcPricingTier } from './entities/bc-pricing-tier.entity';
import { BcLayoutBackground } from './entities/bc-layout-background.entity';
import { BusinessCardsService } from './business-cards.service';
import { AdminBcController, PublicBcController } from './business-cards.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BcProduct, BcLayout, BcPricingTier, BcLayoutBackground]),
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'bc-backgrounds'),
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowed = /jpg|jpeg|png|webp/;
        cb(null, allowed.test(extname(file.originalname).toLowerCase()));
      },
    }),
  ],
  controllers: [AdminBcController, PublicBcController],
  providers: [BusinessCardsService],
  exports: [BusinessCardsService],
})
export class BusinessCardsModule {}
