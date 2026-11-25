-- Барьдаг иш (BP-047): 38,000 → 40,000₮ НӨАТ-гүй (44,000₮ НӨАТ орсон) — эзэмшигчийн баталсан үнэ.
-- products.price_formula.variants доторх тухайн хувилбарыг шинэчилнэ. Idempotent.
UPDATE products p
SET price_formula = jsonb_set(
  p.price_formula,
  '{variants}',
  (
    SELECT jsonb_agg(
      CASE WHEN v->>'code' = 'BP-047'
        THEN v || '{"inc": 44000, "ex": 40000}'::jsonb
        ELSE v END
      ORDER BY idx
    )
    FROM jsonb_array_elements(p.price_formula->'variants') WITH ORDINALITY AS t(v, idx)
  )
)
WHERE p.pricing_mode = 'catalog'
  AND p.price_formula ? 'variants'
  AND jsonb_path_exists(p.price_formula, '$.variants[*] ? (@.code == "BP-047")');
