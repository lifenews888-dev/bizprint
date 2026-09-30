-- Нэг захиалгын мөрөнд (мөргүй бол захиалгад) нэгэн зэрэг зөвхөн НЭГ идэвхтэй
-- хэвлэлийн тасалбар байна. Давхар дарсан/зэрэг илгээсэн dispatch-ийг DB түвшинд хаана.
CREATE UNIQUE INDEX IF NOT EXISTS uq_print_tickets_open
  ON print_tickets ((coalesce(order_item_id, order_id)))
  WHERE status IN ('queued', 'claimed', 'in_hotfolder', 'printing');
