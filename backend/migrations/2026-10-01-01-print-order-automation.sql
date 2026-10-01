-- Төлбөр орсон хэвлэлийн захиалгын автомат урсгалын явц (preflight, принтер олдсон эсэх).
CREATE TABLE IF NOT EXISTS print_order_automation (
  order_id    uuid PRIMARY KEY,
  state       varchar(24) NOT NULL,
  detail      text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
