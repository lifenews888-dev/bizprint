import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'

import { AuthModule } from './auth/auth.module'
import { VendorsModule } from './vendors/vendors.module'
import { CategoriesModule } from './categories/categories.module'
import { ProductsModule } from './products/products.module'
import { VariantsModule } from './variants/variants.module'
import { ProductVariantsModule } from './product-variants/product-variants.module'
import { PriceModule } from './price/price.module'
import { MachinesModule } from './machines/machines.module'
import { PricingModule } from './pricing/pricing.module'
import { PdfInspectorModule } from './ai/pdf-inspector/pdf-inspector.module'
import { SheetOptimizerModule } from './ai/sheet-optimizer/sheet-optimizer.module'
import { GangRunModule } from './ai/gang-run/gang-run.module'
import { MachineSelectorModule } from './ai/machine-selector/machine-selector.module'
import { PrintCostModule } from './ai/print-cost/print-cost.module'
import { ImpositionModule } from './ai/imposition/imposition.module'
import { PrintQuoteModule } from './ai/print-quote/print-quote.module'
import { AutoQuoteModule } from './ai/auto-quote/auto-quote.module'
import { PrintEngineModule } from './ai/print-engine/print-engine.module'
import { PrintSizeModule } from './ai/print-size/print-size.module'
import { QuoteFromFileModule } from './ai/quote-from-file/quote-from-file.module'
import { FullQuoteModule } from './ai/full-quote/full-quote.module'
import { OrdersModule } from './orders/order.module'
import { CartModule } from './cart/cart.module'
import { QuoteModule } from './quote/quote.module'
import { PaymentModule } from './payment/payment.module'
import { ProductionModule } from './production/production.module'
import { VendorDashboardModule } from './vendor-dashboard/vendor-dashboard.module'
import { CustomerDashboardModule } from './customer-dashboard/customer-dashboard.module'
import { AdminModule } from './admin/admin.module'
import { UploadModule } from './upload/upload.module'
import { QuoteEngineModule } from './quote-engine/quote-engine.module'
import { FactoriesModule } from './factories/factories.module'
import { ProductionJobsModule } from './production-jobs/production-jobs.module'
import { ProductionSchedulerModule } from './production-scheduler/production-scheduler.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'bizprint',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: false,
      logging: false,
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    AuthModule,
    VendorsModule,
    CategoriesModule,
    ProductsModule,
    VariantsModule,
    ProductVariantsModule,
    PriceModule,
    MachinesModule,
    PricingModule,
    PdfInspectorModule,
    SheetOptimizerModule,
    GangRunModule,
    MachineSelectorModule,
    PrintCostModule,
    ImpositionModule,
    ProductionSchedulerModule,
    PrintQuoteModule,
    AutoQuoteModule,
    PrintEngineModule,
    PrintSizeModule,
    QuoteFromFileModule,
    FullQuoteModule,
    OrdersModule,
    CartModule,
    QuoteModule,
    PaymentModule,
    ProductionModule,
    VendorDashboardModule,
    CustomerDashboardModule,
    AdminModule,
    UploadModule,
    QuoteEngineModule,
    FactoriesModule,
    ProductionJobsModule,
  ],
})
export class AppModule {}