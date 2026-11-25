-- Чатаар (Яриа + n8n) орж ирсэн бүрэн автомат захиалга: загвар → батлах → QPay → үйлдвэр → хүргэлт.
-- Orders-ийн FROZEN state machine-тай холилдохгүйн тулд тусдаа хүснэгт.
CREATE TABLE IF NOT EXISTS flow_orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no           varchar(32)  NOT NULL UNIQUE,
  source             varchar(24)  NOT NULL DEFAULT 'yria',
  conversation_id    varchar(128) NOT NULL,
  customer_name      varchar(160),
  customer_phone     varchar(32)  NOT NULL,
  product            varchar(32)  NOT NULL DEFAULT 'business_card',
  bc_product_id      uuid,
  template           varchar(64)  NOT NULL,
  quantity           integer      NOT NULL,
  finish             varchar(16)  NOT NULL DEFAULT 'none',
  fields             jsonb        NOT NULL DEFAULT '{}'::jsonb,
  logo_url           text,
  unit_price         numeric(14,2) NOT NULL,
  amount_ex_vat      numeric(14,2) NOT NULL,
  vat                numeric(14,2) NOT NULL DEFAULT 0,
  amount             numeric(14,2) NOT NULL,
  status             varchar(24)  NOT NULL DEFAULT 'rendering',
  status_history     jsonb        NOT NULL DEFAULT '[]'::jsonb,
  edit_count         integer      NOT NULL DEFAULT 0,
  preview_urls       jsonb,
  pdf_url            text,
  render_job_id      varchar(64),
  render_warnings    jsonb,
  render_error       text,
  qpay_invoice_id    varchar(64),
  approved_at        timestamptz,
  paid_at            timestamptz,
  paid_amount        numeric(14,2),
  payment_id         varchar(64),
  sent_to_factory_at timestamptz,
  ready_at           timestamptz,
  delivery_method    varchar(16),
  delivery_address   text,
  delivered_at       timestamptz,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flow_orders_status ON flow_orders (status);
CREATE INDEX IF NOT EXISTS idx_flow_orders_conversation ON flow_orders (conversation_id);
CREATE INDEX IF NOT EXISTS idx_flow_orders_created ON flow_orders (created_at DESC);
