"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const chat_module_1 = require("./chat/chat.module");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const vendors_module_1 = require("./vendors/vendors.module");
const categories_module_1 = require("./categories/categories.module");
const wallet_module_1 = require("./wallet/wallet.module");
const referral_module_1 = require("./referral/referral.module");
const products_module_1 = require("./products/products.module");
const product_attributes_module_1 = require("./product-attributes/product-attributes.module");
const variants_module_1 = require("./variants/variants.module");
const product_variants_module_1 = require("./product-variants/product-variants.module");
const price_module_1 = require("./price/price.module");
const machines_module_1 = require("./machines/machines.module");
const pricing_module_1 = require("./pricing/pricing.module");
const pdf_inspector_module_1 = require("./ai/pdf-inspector/pdf-inspector.module");
const sheet_optimizer_module_1 = require("./ai/sheet-optimizer/sheet-optimizer.module");
const gang_run_module_1 = require("./ai/gang-run/gang-run.module");
const machine_selector_module_1 = require("./ai/machine-selector/machine-selector.module");
const print_cost_module_1 = require("./ai/print-cost/print-cost.module");
const imposition_module_1 = require("./ai/imposition/imposition.module");
const print_quote_module_1 = require("./ai/print-quote/print-quote.module");
const auto_quote_module_1 = require("./ai/auto-quote/auto-quote.module");
const print_engine_module_1 = require("./ai/print-engine/print-engine.module");
const print_size_module_1 = require("./ai/print-size/print-size.module");
const quote_from_file_module_1 = require("./ai/quote-from-file/quote-from-file.module");
const full_quote_module_1 = require("./ai/full-quote/full-quote.module");
const order_module_1 = require("./orders/order.module");
const cart_module_1 = require("./cart/cart.module");
const payment_module_1 = require("./payment/payment.module");
const production_module_1 = require("./production/production.module");
const vendor_dashboard_module_1 = require("./vendor-dashboard/vendor-dashboard.module");
const customer_dashboard_module_1 = require("./customer-dashboard/customer-dashboard.module");
const admin_module_1 = require("./admin/admin.module");
const upload_module_1 = require("./upload/upload.module");
const quote_engine_module_1 = require("./quote-engine/quote-engine.module");
const factories_module_1 = require("./factories/factories.module");
const production_jobs_module_1 = require("./production-jobs/production-jobs.module");
const mail_module_1 = require("./mail/mail.module");
const settings_module_1 = require("./settings/settings.module");
const paper_types_module_1 = require("./paper-types/paper-types.module");
const design_requests_module_1 = require("./design-requests/design-requests.module");
const delivery_module_1 = require("./delivery/delivery.module");
const templates_module_1 = require("./templates/templates.module");
const quotes_v2_module_1 = require("./quotes-v2/quotes-v2.module");
const banners_module_1 = require("./banners/banners.module");
const pages_module_1 = require("./pages/pages.module");
const menus_module_1 = require("./menus/menus.module");
const files_module_1 = require("./files/files.module");
const audit_trail_module_1 = require("./audit-trail/audit-trail.module");
const pricing_catalog_controller_1 = require("./pricing-catalog/pricing-catalog.controller");
const pricing_catalog_service_1 = require("./pricing-catalog/pricing-catalog.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            chat_module_1.ChatModule,
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
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
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            auth_module_1.AuthModule,
            vendors_module_1.VendorsModule,
            categories_module_1.CategoriesModule,
            wallet_module_1.WalletModule,
            referral_module_1.ReferralModule,
            products_module_1.ProductsModule,
            product_attributes_module_1.ProductAttributesModule,
            variants_module_1.VariantsModule,
            product_variants_module_1.ProductVariantsModule,
            price_module_1.PriceModule,
            machines_module_1.MachinesModule,
            pricing_module_1.PricingModule,
            pdf_inspector_module_1.PdfInspectorModule,
            sheet_optimizer_module_1.SheetOptimizerModule,
            gang_run_module_1.GangRunModule,
            machine_selector_module_1.MachineSelectorModule,
            print_cost_module_1.PrintCostModule,
            imposition_module_1.ImpositionModule,
            payment_module_1.PaymentModule,
            print_quote_module_1.PrintQuoteModule,
            auto_quote_module_1.AutoQuoteModule,
            print_engine_module_1.PrintEngineModule,
            print_size_module_1.PrintSizeModule,
            quote_from_file_module_1.QuoteFromFileModule,
            full_quote_module_1.FullQuoteModule,
            order_module_1.OrdersModule,
            cart_module_1.CartModule,
            production_module_1.ProductionModule,
            vendor_dashboard_module_1.VendorDashboardModule,
            customer_dashboard_module_1.CustomerDashboardModule,
            admin_module_1.AdminModule,
            upload_module_1.UploadModule,
            quote_engine_module_1.QuoteEngineModule,
            factories_module_1.FactoriesModule,
            production_jobs_module_1.ProductionJobsModule,
            mail_module_1.MailModule,
            settings_module_1.SettingsModule,
            paper_types_module_1.PaperTypesModule,
            design_requests_module_1.DesignRequestsModule,
            delivery_module_1.DeliveryModule,
            templates_module_1.TemplatesModule,
            quotes_v2_module_1.QuotesV2Module,
            banners_module_1.BannersModule,
            pages_module_1.PagesModule,
            menus_module_1.MenusModule,
            files_module_1.FilesModule,
            audit_trail_module_1.AuditTrailModule,
        ],
        controllers: [pricing_catalog_controller_1.PricingCatalogController],
        providers: [pricing_catalog_service_1.PricingCatalogService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map