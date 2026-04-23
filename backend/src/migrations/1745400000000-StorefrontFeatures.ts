import { MigrationInterface, QueryRunner } from 'typeorm';

export class StorefrontFeatures1745400000000 implements MigrationInterface {
  name = 'StorefrontFeatures1745400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "created_by_user_id" character varying`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "sales_products" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "sales_user_id" character varying NOT NULL, "product_id" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_sales_products_user_product" UNIQUE ("sales_user_id", "product_id"), CONSTRAINT "PK_sales_products" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sales_products_user_active" ON "sales_products" ("sales_user_id", "is_active")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "designer_royalties" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "order_id" character varying, "designer_user_id" character varying NOT NULL, "template_id" character varying, "template_name" character varying, "order_total" numeric(14,2) NOT NULL DEFAULT 0, "royalty_rate" numeric(5,2) NOT NULL DEFAULT 5, "royalty_amount" numeric(14,2) NOT NULL DEFAULT 0, "status" character varying NOT NULL DEFAULT 'pending', "paid_at" TIMESTAMP, "payout_batch_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_designer_royalties" PRIMARY KEY ("id"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "designer_royalties"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales_products"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "created_by_user_id"`);
  }
}
