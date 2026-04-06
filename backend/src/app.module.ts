import { Module } from '@nestjs/common'
import { ChatModule } from './chat/chat.module'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { EventsModule } from './events/events.module'
import { SyncModule } from './sync/sync.module'

import { AuthModule } from './auth/auth.module'
import { VendorsModule } from './vendors/vendors.module'
import { CategoriesModule } from './categories/categories.module'
import { WalletModule } from './wallet/wallet.module'
import { ReferralModule } from './referral/referral.module'
import { ProductsModule } from './products/products.module'
import { ProductAttributesModule } from './product-attributes/product-attributes.module'
import { VariantsModule } from './variants/variants.module'
import { ProductVariantsModule } from './product-variants/product-variants.module'
import { MachinesModule } from './machines/machines.module'
import { PdfInspectorModule } from './ai/pdf-inspector/pdf-inspector.module'
import { SheetOptimizerModule } from './ai/sheet-optimizer/sheet-optimizer.module'
import { GangRunModule } from './ai/gang-run/gang-run.module'
import { MachineSelectorModule } from './ai/machine-selector/machine-selector.module'
import { PrintCostModule } from './ai/print-cost/print-cost.module'
import { ImpositionModule } from './ai/imposition/imposition.module'
import { PrintSizeModule } from './ai/print-size/print-size.module'
import { OrdersModule } from './orders/order.module'
import { CartModule } from './cart/cart.module'
import { PaymentModule } from './payment/payment.module'
import { ProductionModule } from './production/production.module'
import { VendorDashboardModule } from './vendor-dashboard/vendor-dashboard.module'
import { CustomerDashboardModule } from './customer-dashboard/customer-dashboard.module'
import { AdminModule } from './admin/admin.module'
import { UploadModule } from './upload/upload.module'
import { QuoteEngineModule } from './quote-engine/quote-engine.module'
import { FactoriesModule } from './factories/factories.module'
import { ProductionJobsModule } from './production-jobs/production-jobs.module'
import { MailModule } from './mail/mail.module'
import { SettingsModule } from './settings/settings.module'
import { PaperTypesModule } from './paper-types/paper-types.module'
import { DesignRequestsModule } from './design-requests/design-requests.module'
import { DeliveryModule } from './delivery/delivery.module'
import { TemplatesModule } from './templates/templates.module'
import { QuoteModule } from './quote/quote.module'
import { BannersModule } from './banners/banners.module'
import { PagesModule } from './pages/pages.module'
import { PostsModule } from './posts/posts.module'
import { MenusModule } from './menus/menus.module'
import { FilesModule } from './files/files.module'
import { AuditTrailModule } from './audit-trail/audit-trail.module'
// REMOVED: PricingCatalog — duplicate of pricing-rules catalog
// import { PricingCatalogController } from './pricing-catalog/pricing-catalog.controller'
// import { PricingCatalogService } from './pricing-catalog/pricing-catalog.service'
import { NotificationModule } from './notifications/notification.module'
import { PricingConfigModule } from './pricing-config/pricing-config.module'
import { ProductsMasterModule } from './products-master/products-master.module'
// REMOVED: PricingEngine — duplicate of quote/pricing.service (uses wrong 45% margin)
// import { PricingEngineModule } from './pricing-engine/pricing-engine.module'
import { CustomerCareModule } from './customer-care/customer-care.module'
import { CmsModule } from './cms/cms.module'
import { MarketingModule } from './marketing/marketing.module'
import { SmartQuoteModule } from './ai/smart-quote/smart-quote.module'
import { ShippingModule } from './shipping/shipping.module'
import { ReportsModule } from './reports/reports.module'
import { CapacityModule } from './capacity/capacity.module'
import { ErrorLogModule } from './error-log/error-log.module'
import { CreatorModule } from './creator/creator.module'
import { DigitalCardModule } from './digital-card/digital-card.module'
import { BusinessCardsModule } from './business-cards/business-cards.module'
import { InvitationModule } from './invitation/invitation.module'
import { ProductQrModule } from './product-qr/product-qr.module'
import { SubscriptionModule } from './subscription/subscription.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { SystemModule } from './system/system.module'
import { LoyaltyModule } from './loyalty/loyalty.module'
import { ZoomModule } from './zoom/zoom.module'
import { MegaMenuModule } from './mega-menu/mega-menu.module'
import { GalleryModule } from './gallery/gallery.module'
import { AgentModule } from './ai/agent/agent.module'
import { MaterialsModule } from './materials/materials.module'
import { QaModule } from './qa/qa.module'
import { WarehouseModule } from './warehouse/warehouse.module'
import { B2BModule } from './b2b/b2b.module'
import { ProofingModule } from './proofing/proofing.module'
import { PrepressModule } from './ai/prepress/prepress.module'
import { GeoRoutingModule } from './geo-routing/geo-routing.module'

@Module({
  imports: [
    EventsModule,   // ← Global EventBus (must be first)
    SyncModule,     // ← WebSocket /sync gateway
    ChatModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            autoLoadEntities: true,
            synchronize: process.env.NODE_ENV !== 'production',
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
            logging: false,
          }
        : {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            username: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || process.env.DB_PASS || 'postgres',
            database: process.env.DB_DATABASE || process.env.DB_NAME || 'bizprint',
            autoLoadEntities: true,
            synchronize: true,
            dropSchema: false,
            logging: false,
          },
    ),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    VendorsModule,
    CategoriesModule,
    WalletModule,
    ReferralModule,
    ProductsModule,
    ProductAttributesModule,
    VariantsModule,
    ProductVariantsModule,
    MachinesModule,
    PdfInspectorModule,
    SheetOptimizerModule,
    GangRunModule,
    MachineSelectorModule,
    PrintCostModule,
    ImpositionModule,
    PaymentModule,
    PrintSizeModule,
    OrdersModule,
    CartModule,
    ProductionModule,
    VendorDashboardModule,
    CustomerDashboardModule,
    AdminModule,
    UploadModule,
    QuoteEngineModule,
    FactoriesModule,
    ProductionJobsModule,
    MailModule,
    SettingsModule,
    PaperTypesModule,
    DesignRequestsModule,
    DeliveryModule,
    TemplatesModule,
    QuoteModule,
    BannersModule,
    PagesModule,
    PostsModule,
    MenusModule,
    FilesModule,
    AuditTrailModule,
    NotificationModule,
    PricingConfigModule,
    ProductsMasterModule,
    // PricingEngineModule, // REMOVED — duplicate pricing, wrong 45% margin
    CustomerCareModule,
    CmsModule,
    MarketingModule,
    SmartQuoteModule,
    ShippingModule,
    ReportsModule,
    CapacityModule,
    ErrorLogModule,
    CreatorModule,
    DigitalCardModule,
    BusinessCardsModule,
    InvitationModule,
    ProductQrModule,
    SubscriptionModule,
    AnalyticsModule,
    SystemModule,
    LoyaltyModule,
    ZoomModule,
    MegaMenuModule,
    GalleryModule,
    AgentModule,
    MaterialsModule,
    QaModule,
    WarehouseModule,
    B2BModule,
    ProofingModule,
    PrepressModule,
    GeoRoutingModule,
  ],
  controllers: [], // PricingCatalogController removed — duplicate
  providers: [],   // PricingCatalogService removed — duplicate
})
export class AppModule {}
