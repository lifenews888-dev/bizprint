import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration — creates all 22 canonical tables per CLAUDE.md spec.
 * This migration is idempotent (IF NOT EXISTS) so it's safe to run on an
 * existing DB that was created via synchronize: true.
 */
export class CreateInitialSchema1711100000000 implements MigrationInterface {
  name = 'CreateInitialSchema1711100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enum types ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "order_status_enum" AS ENUM (
          'draft','quotation_sent','confirmed','pending_file','file_review',
          'file_rejected','on_hold','in_production','finishing',
          'partially_dispatched','dispatched','delivered','completed','cancelled'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cart_status_enum" AS ENUM ('active','merged','converted','expired','abandoned');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "quote_status_enum" AS ENUM ('draft','sent','confirmed','ordered','expired');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "production_status_enum" AS ENUM ('queued','assigned','printing','finishing','completed');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "stage_status_enum" AS ENUM ('pending','in_progress','completed','skipped');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "invoice_type_enum" AS ENUM ('customer_invoice','vendor_payout');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "invoice_status_enum" AS ENUM ('draft','issued','paid','overdue','cancelled');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "shipment_status_enum" AS ENUM ('preparing','picked_up','in_transit','delivered','returned');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ── 1. roles ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar UNIQUE NOT NULL,
        "description" varchar,
        "permissions" jsonb DEFAULT '[]',
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 2. users ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar UNIQUE NOT NULL,
        "password_hash" varchar NOT NULL,
        "full_name" varchar NOT NULL,
        "phone" varchar,
        "company_name" varchar,
        "register_number" varchar,
        "avatar_url" varchar,
        "preferred_lang" varchar DEFAULT 'mn',
        "role" varchar DEFAULT 'customer',
        "role_id" uuid REFERENCES "roles"("id"),
        "totp_enabled" boolean DEFAULT false,
        "totp_secret" varchar,
        "is_verified" boolean DEFAULT false,
        "is_active" boolean DEFAULT true,
        "last_login_at" TIMESTAMP,
        "bank_name" varchar,
        "bank_account" varchar,
        "bank_account_name" varchar,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 3. products ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "slug" varchar,
        "description" text,
        "category" varchar,
        "base_price" decimal(14,2) DEFAULT 0,
        "thumbnail_url" varchar,
        "images" jsonb,
        "is_active" boolean DEFAULT true,
        "sort_order" int DEFAULT 0,
        "width_mm" int,
        "height_mm" int,
        "type" varchar,
        "icon" varchar,
        "rating" decimal(3,1),
        "lead_time_days" int,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 4. pricing_rules (product_rules in spec) ────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pricing_rules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "product_id" uuid REFERENCES "products"("id"),
        "product_master_id" uuid,
        "category_id" varchar,
        "label" varchar,
        "attribute_key" varchar,
        "attribute_value" varchar DEFAULT '',
        "price_multiplier" decimal(10,4),
        "price_addition" decimal(14,2),
        "price_override" decimal(14,2),
        "min_quantity" int,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 5. carts ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "status" varchar DEFAULT 'active'
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_cart_active_customer"
      ON "carts" ("customer_id") WHERE status = 'active';
    `);

    // ── 6. cart_items ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "cart_id" uuid REFERENCES "carts"("id"),
        "product_id" varchar NOT NULL,
        "quantity" int NOT NULL,
        "specs" jsonb,
        "unit_price" decimal(14,2),
        "created_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 7. quotations (quotes_v2 table) ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quotes_v2" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "quote_number" varchar UNIQUE NOT NULL,
        "customer_name" varchar DEFAULT '',
        "customer_phone" varchar DEFAULT '',
        "customer_email" varchar DEFAULT '',
        "product_name" varchar,
        "product_description" varchar,
        "quantity" int DEFAULT 1,
        "pages" int,
        "size" varchar,
        "width_mm" int,
        "height_mm" int,
        "paper_type" varchar,
        "paper_gsm" int,
        "color_mode" varchar,
        "sides" varchar,
        "finishing" varchar,
        "binding" varchar,
        "unit_price" decimal(14,2) DEFAULT 0,
        "total_price" decimal(14,2) DEFAULT 0,
        "discount_amount" decimal(14,2) DEFAULT 0,
        "rush_fee" decimal(14,2) DEFAULT 0,
        "savings_amount" decimal(14,2) DEFAULT 0,
        "urgency" varchar,
        "breakdown" jsonb,
        "smart_adjustments" jsonb,
        "product_type" varchar,
        "product_subtype" varchar,
        "dimensions" jsonb,
        "base_price" decimal(14,2) DEFAULT 0,
        "margin_rate" decimal(6,4),
        "extras" jsonb,
        "pricing_mode" varchar,
        "expires_at" TIMESTAMP,
        "guest_email" varchar,
        "user_id" varchar,
        "rush_type" varchar,
        "guest_name" varchar,
        "guest_phone" varchar,
        "company_name" varchar,
        "status" varchar DEFAULT 'draft',
        "valid_until" TIMESTAMP,
        "notes" varchar,
        "email_sent" boolean DEFAULT false,
        "daily_report_sent" boolean DEFAULT false,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 8. quotation_items ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quotation_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "quotation_id" uuid REFERENCES "quotes_v2"("id"),
        "product_id" uuid REFERENCES "products"("id"),
        "quantity" int NOT NULL,
        "vendor_cost" decimal(14,2) DEFAULT 0,
        "margin_rate" decimal(6,4) DEFAULT 0,
        "customer_price" decimal(14,2) DEFAULT 0,
        "specs" jsonb,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 9. orders ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customer_id" uuid REFERENCES "users"("id"),
        "product_id" uuid REFERENCES "products"("id"),
        "quote_id" varchar,
        "quote_number" varchar,
        "customer_name" varchar,
        "customer_phone" varchar,
        "customer_email" varchar,
        "product_name" varchar,
        "quantity" int NOT NULL,
        "width_mm" int,
        "height_mm" int,
        "paper_gsm" int,
        "color_mode" varchar,
        "sides" varchar,
        "finishing" varchar,
        "factory_id" varchar,
        "unit_price" decimal(14,2),
        "total_price" decimal(14,2),
        "options" jsonb,
        "notes" varchar,
        "status" varchar DEFAULT 'draft',
        "payment_status" varchar,
        "payment_method" varchar,
        "invoice_no" varchar,
        "file_url" varchar,
        "assigned_to" varchar,
        "deadline" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 10. order_items ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" uuid REFERENCES "orders"("id") NOT NULL,
        "product_id" uuid REFERENCES "products"("id"),
        "vendor_group_id" uuid,
        "quantity" int NOT NULL,
        "unit_price" decimal(14,2) DEFAULT 0,
        "total_price" decimal(14,2) DEFAULT 0,
        "specs" jsonb,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 11. order_vendor_groups ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_vendor_groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" uuid REFERENCES "orders"("id") NOT NULL,
        "vendor_id" uuid NOT NULL,
        "subtotal" decimal(14,2) DEFAULT 0,
        "status" varchar DEFAULT 'pending',
        "assigned_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);
    // Add FK for order_items.vendor_group_id after order_vendor_groups exists
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "order_items"
          ADD CONSTRAINT "FK_order_items_vendor_group"
          FOREIGN KEY ("vendor_group_id") REFERENCES "order_vendor_groups"("id");
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ── 12. vendors ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendors" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "company_name" varchar NOT NULL,
        "contact_email" varchar NOT NULL,
        "phone" varchar,
        "address" varchar,
        "verified" boolean DEFAULT false,
        "created_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 13. machines ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "machines" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL,
        "type" varchar NOT NULL,
        "speed_per_hour" int NOT NULL,
        "sheet_width_mm" int NOT NULL,
        "sheet_height_mm" int NOT NULL,
        "hour_rate" int NOT NULL,
        "factory_id" int NOT NULL,
        "status" varchar DEFAULT 'available',
        "created_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 14. capabilities ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "capabilities" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar UNIQUE NOT NULL,
        "category" varchar NOT NULL,
        "description" varchar,
        "created_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 15. vendor_capabilities ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_capabilities" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "vendor_id" uuid REFERENCES "vendors"("id") NOT NULL,
        "capability_id" uuid REFERENCES "capabilities"("id") NOT NULL,
        "specs" jsonb,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_vendor_capability"
      ON "vendor_capabilities" ("vendor_id", "capability_id");
    `);

    // ── 16. production_jobs ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "production_jobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" varchar NOT NULL,
        "machine_id" varchar,
        "vendor_id" varchar,
        "status" varchar DEFAULT 'queued',
        "start_time" TIMESTAMP,
        "end_time" TIMESTAMP
      );
    `);

    // ── 17. production_stages ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "production_stages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "production_job_id" uuid REFERENCES "production_jobs"("id") NOT NULL,
        "stage_name" varchar NOT NULL,
        "stage_order" int NOT NULL,
        "status" varchar DEFAULT 'pending',
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "operator_id" uuid REFERENCES "users"("id"),
        "notes" text,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 18. invoices ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" uuid REFERENCES "orders"("id") NOT NULL,
        "invoice_number" varchar UNIQUE NOT NULL,
        "customer_id" uuid REFERENCES "users"("id") NOT NULL,
        "vendor_id" uuid REFERENCES "vendors"("id"),
        "type" varchar DEFAULT 'customer_invoice',
        "subtotal" decimal(12,2) DEFAULT 0,
        "tax_amount" decimal(12,2) DEFAULT 0,
        "total_amount" decimal(12,2) DEFAULT 0,
        "status" varchar DEFAULT 'draft',
        "issued_at" TIMESTAMP,
        "paid_at" TIMESTAMP,
        "due_date" date,
        "metadata" jsonb,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 19. payments ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" uuid REFERENCES "orders"("id"),
        "invoice_code" varchar,
        "method" varchar,
        "amount" decimal(14,2),
        "status" varchar DEFAULT 'pending',
        "paid_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 20. shipments ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" uuid REFERENCES "orders"("id") NOT NULL,
        "vendor_group_id" uuid REFERENCES "order_vendor_groups"("id"),
        "tracking_number" varchar,
        "carrier" varchar,
        "status" varchar DEFAULT 'preparing',
        "shipped_at" TIMESTAMP,
        "delivered_at" TIMESTAMP,
        "estimated_delivery" date,
        "shipping_address" jsonb,
        "notes" text,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 21. shipment_items ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipment_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "shipment_id" uuid REFERENCES "shipments"("id") NOT NULL,
        "order_item_id" uuid REFERENCES "order_items"("id") NOT NULL,
        "quantity" int NOT NULL,
        "created_at" TIMESTAMP DEFAULT now()
      );
    `);

    // ── 22. events (polymorphic audit log) ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "entity_type" varchar NOT NULL,
        "entity_id" uuid NOT NULL,
        "action" varchar NOT NULL,
        "old_value" jsonb,
        "new_value" jsonb,
        "actor_id" uuid REFERENCES "users"("id"),
        "actor_type" varchar DEFAULT 'user',
        "metadata" jsonb,
        "created_at" TIMESTAMP DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_events_entity"
      ON "events" ("entity_type", "entity_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order to respect FKs
    await queryRunner.query(`DROP TABLE IF EXISTS "shipment_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shipments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "production_stages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "production_jobs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_capabilities" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "capabilities" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "events" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_vendor_groups" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quotation_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quotes_v2" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pricing_rules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "machines" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendors" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
  }
}
