#!/usr/bin/env python3
"""
Сайтын албан үнийн жагсаалтаар (НӨАТ орсон) тооцоолуур + дэлгүүрийг нэг стандартаар үүсгэнэ.

  python scripts/build-price-catalog.py "<v6.xlsx>"            # 1) дотоод v6-аас бүтэц, шатлал, хүргэлт
  python scripts/build-shop-catalog.py  "<Сайтын үнийн жагсаалт - НӨАТ орсон v1.xlsx>"   # 2) энэ скрипт

Гаралт:
  lib/pricing/catalog.json  — тооцоолуур ба барааны хуудасны нэг эх сурвалж
  lib/pricing/popular.json  — нүүр хуудасны жишээ үнэ
  ../backend/migrations/<огноо>-shop-catalog-<хувилбар>.sql — дэлгүүрийн бараа (хуучныг идэвхгүй болгоно)

Үнийн дүрэм (албан жагсаалттай яг таарна):
  - ширхэг, багц, урт метр: жагсаалтын НӨАТ-тэй үнэ
  - м²: НӨАТ-гүй м² үнэ × 1.1 × талбай → бөөрөнхийлнө; бэлэн хэмжээ бол жагсаалтын үнэ
  - бөөрөнхийлөлт: 10,000₮-өөс дээш 100₮ хүртэл, доош 10₮ хүртэл
"""
import json, re, sys, datetime
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
CAT_JSON = ROOT / "lib" / "pricing" / "catalog.json"
MIGR_DIR = ROOT.parent / "backend" / "migrations"
SITE = Path(sys.argv[1])
VERSION = "Албан үнэ 2026-11-25"
# Хэрэгжсэн migration-ийг ХЭЗЭЭ Ч засахгүй (backend boot унана) — шинэчлэл бүрт шинэ нэр
MIGR_NAME = "2026-11-25-04-shop-catalog-v3.sql"
IMG_BASE = "/catalog-img/"
PRINITY_URL = "https://prinity-cloud-production.up.railway.app/u/Nn36KDAEc2Q-fpugKEDsv0IA_kWHnP8g"

CATEGORIES = [  # (сайтын ангилал, slug)
    ("Нэрийн хуудас", "business-card"),
    ("Маркетингийн хэвлэл", "marketing"),
    ("Албан хэрэг, бичиг хэрэг", "office"),
    ("Баннер, стенд", "banner"),
    ("Стикер, наалт", "sticker"),
    ("Хавтан, самбар", "board"),
    ("Туг далбаа", "flag"),
    ("Хаяг реклам", "signage"),
    ("Хувцас, даавуун хэвлэл", "apparel"),
    ("Промо бэлэг дурсгал", "promo"),
    ("Үнэмлэх, тэмдэг, шагнал", "badge"),
    ("Зураг, альбум", "photo"),
]
CAT_SLUG = dict(CATEGORIES)
ADDON_CODES = {"BP-183", "BP-184", "BP-185"}          # цагийн реле, тог бууруулагч, кран
ADDON_TYPES = {"Биет үсэг, фасадны хаяг", "Лайтбокс (гэрэлтдэг хаяг)"}
PRINITY_TYPES = {"Зураг угаалт", "Альбум ном"}
BOOK_TYPE = "Ном, сэтгүүл, каталог"
FEATURED = {"bizcard", "banner", "flagoutdoor", "brochure", "sticker", "pen", "lflag", "letters"}


def roundp(x):
    """Албан жагсаалтын бөөрөнхийлөлт."""
    return int(x / 100 + 0.5) * 100 if x >= 10000 else int(x / 10 + 0.5) * 10


cat = json.loads(CAT_JSON.read_text(encoding="utf-8"))
v6 = {i["code"]: i for i in cat["items"]}

ws = openpyxl.load_workbook(SITE, read_only=True, data_only=True).worksheets[0]
rows = [r for r in list(ws.iter_rows(values_only=True))[2:] if r and r[0]]
is_preset = lambda code: bool(re.match(r"^[A-Z]{2}-\d+-", code))

items, types, presets, problems = [], {}, {}, []
for r in rows:
    code, cat_name, type_name, name, size, price, about, needs, img1, img2, page = (str(c).strip() if c is not None else "" for c in r[:11])
    price = int(float(price))
    if cat_name not in CAT_SLUG:
        problems.append(f"{code}: үл мэдэх ангилал «{cat_name}»"); continue
    if is_preset(code):  # бэлэн хэмжээ → үндсэн м² барааны preset
        base = re.match(r"^([A-Z]{2}-\d+)", code).group(1)
        m = re.match(r"([\d.]+)\s*×\s*([\d.]+)", size)
        if m: presets.setdefault(base, []).append([float(m.group(1)), float(m.group(2)), price])
        continue
    it = dict(v6.get(code) or {})
    if not it:
        problems.append(f"{code}: v6-д байхгүй, алгаслаа"); continue
    slug = re.sub(r"^\d+-|-\d\.jpg$", "", img1)
    it.update({"cat": cat_name, "type": type_name, "inc": price, "about": about or it.get("about", ""),
               "needs": needs or it.get("needs", "")})
    if it["unit"] == "tier":
        it["tiers"] = [{"min": t["min"], "inc": price if i == 0 else roundp(t["ex"] * 1.1)} for i, t in enumerate(it["tiers"])]
    elif it.get("ex") and it["unit"] != "m2" and roundp(it["ex"] * 1.1) != price:
        problems.append(f"{code}: v6 {roundp(it['ex']*1.1)} ≠ сайт {price} (сайтынхыг авлаа)")
    if it.get("rope"): it["rope"] = roundp(it["rope"] * 1.1)
    if code in ADDON_CODES: it["addon"] = True
    it.pop("spec", None)
    items.append(it)
    t = types.setdefault(type_name, {"name": type_name, "slug": slug, "cat": cat_name, "catSlug": CAT_SLUG[cat_name],
                                     "img": [IMG_BASE + re.sub(r"^\d+-", "", img1), IMG_BASE + re.sub(r"^\d+-", "", img2)],
                                     "codes": []})
    t["codes"].append(code)

for code, ps in presets.items():
    if code in v6 and v6[code]["unit"] != "m2":
        problems.append(f"{code}: м² биш бараанд бэлэн хэмжээ"); continue
cat_presets = {c: [[w, h] for w, h, _ in ps] for c, ps in presets.items()}
for it in items:
    if it["unit"] == "m2":
        it["presets"] = [{"w": w, "h": h, "inc": p} for w, h, p in presets.get(it["code"], [])] or \
                        [{"w": w, "h": h} for w, h in cat["presets"].get(it["code"], [])]

# Хаягийн нэмэлт бүрэлдэхүүн хоёр төрөлд хоёуланд нь харагдана
addon_codes = [i["code"] for i in items if i.get("addon")]
for tn in ADDON_TYPES:
    if tn in types:
        types[tn]["addons"] = addon_codes
        types[tn]["codes"] = [c for c in types[tn]["codes"] if c not in ADDON_CODES]
        types[tn]["note"] = "Суурилуулалт, ачилт, тээврийг газар дээр нь хэмжээд тусад нь үнийн санал гаргана."
for tn in PRINITY_TYPES:
    if tn in types:
        types[tn]["external"] = {"url": PRINITY_URL, "label": "Зургаа Prinity-ээр илгээх",
                                 "note": "Зураг, альбумын захиалгыг Prinity дээр зургаа оруулж, хэмжээгээ сонгоод илгээнэ."}
if BOOK_TYPE in types: types[BOOK_TYPE]["books"] = True

# Бодит ажлын зураг (E:\\Biz print\\Бодит зураг-аас 1:1 тайрсан) — албан мокапын дараа нэмнэ
REAL = json.loads((Path(__file__).with_name("real-images.json")).read_text(encoding="utf-8"))
for t in types.values():
    t["img"] = t["img"] + REAL.get(t["slug"], [])

cat_order = {c: i for i, (c, _) in enumerate(CATEGORIES)}
type_list = sorted(types.values(), key=lambda t: cat_order[t["cat"]])
for i, t in enumerate(type_list):
    first = next(x for x in items if x["code"] == t["codes"][0])
    t["about"] = first.get("about", "")
    t["sort"] = i + 1

cat.update({
    "version": VERSION,
    "categories": [c for c, _ in CATEGORIES if c in {t["cat"] for t in type_list}],
    "categorySlugs": {c: s for c, s in CATEGORIES},
    "types": type_list,
    "items": items,
})
cat.pop("presets", None)
CAT_JSON.write_text(json.dumps(cat, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{CAT_JSON}: {len(items)} бараа, {len(type_list)} бүтээгдэхүүн, {len(cat['categories'])} ангилал, {sum(len(v) for v in presets.values())} бэлэн хэмжээ")

# --- Нүүр хуудасны жишээ ---------------------------------------------------------
byc = {i["code"]: i for i in items}
pres = lambda c, w, h: next(p["inc"] for p in byc[c]["presets"] if p["w"] == w and p["h"] == h)
popular = [
    {"code": "BP-077", "title": "Нэрийн хуудас 500ш", "calc": "300гр, энгийн · 500ш багц", "inc": byc["BP-077"]["inc"]},
    {"code": "BP-007", "title": "Бельги баннер 1×3 м", "calc": f"Бэлэн хэмжээ {pres('BP-007',1,3):,}₮ + олс, бөгж",
     "inc": pres("BP-007", 1, 3) + roundp(byc["BP-007"]["rope"] * 3)},
    {"code": "BP-001", "title": "X баннер стенд", "calc": "160×60 см, хүрээ + хэвлэл", "inc": byc["BP-001"]["inc"]},
    {"code": "BP-056", "title": "Байгууллагын туг 2×1 м", "calc": "Суурьтай иж бүрдэл", "inc": byc["BP-056"]["inc"]},
    {"code": "PR-01", "title": "Логотой үзэг 100ш", "calc": f"100 × {[t for t in byc['PR-01']['tiers'] if t['min'] <= 100][-1]['inc']:,}₮",
     "inc": [t for t in byc["PR-01"]["tiers"] if t["min"] <= 100][-1]["inc"] * 100},
]
def from_price(t):
    fps = []
    for c in t["codes"]:
        x = byc[c]
        if x["unit"] == "tier": fps.append((x["tiers"][-1]["inc"], "ш"))
        elif x["unit"] == "pack": fps.append((x["inc"], f"{x['pack']}ш"))
        else: fps.append((x["inc"], {"m2": "м²", "lm": "м"}.get(x["unit"], "ш")))
    return min(fps)
home_types = [{"name": t["name"], "slug": t["slug"], "cat": t["cat"], "img": t["img"][0],
               "from": from_price(t)[0], "per": from_price(t)[1]} for t in type_list]
(CAT_JSON.with_name("popular.json")).write_text(json.dumps({"version": VERSION, "items": popular, "categories": [c for c, _ in CATEGORIES], "types": home_types}, ensure_ascii=False, indent=1), encoding="utf-8")

# --- Дэлгүүрийн migration ---------------------------------------------------------
def variant(i):
    keep = ("code", "family", "option", "unit", "pack", "inc", "ex", "tiers", "min", "presets", "rope", "delivery", "addon")
    return {k: i[k] for k in keep if i.get(k) not in (None, "", [], 0) or k in ("code", "unit", "inc")}

products = []
for t in type_list:
    main = [byc[c] for c in t["codes"]]
    start = min((x["tiers"][0]["inc"] if x["unit"] == "tier" else x["inc"]) for x in main)
    formula = {"type": "catalog", "version": VERSION, "variants": [variant(byc[c]) for c in t["codes"] + t.get("addons", [])]}
    if t.get("books"): formula["books"] = cat["books"]
    if t.get("external"): formula["external"] = t["external"]
    if t.get("note"): formula["note"] = t["note"]
    units = {x["unit"] for x in main}
    products.append({
        "product_type": "print",
        "name": t["name"], "name_mn": t["name"], "slug": t["slug"],
        "category": t["catSlug"], "subcategory": t["cat"],
        "description": t["about"],
        "base_price": start, "min_quantity": 1,
        "thumbnail_url": t["img"][0], "images": t["img"],
        "sku": "BPS-" + t["slug"],
        "is_active": True, "sort_order": t["sort"],
        "is_featured": t["slug"] in FEATURED, "is_new": False, "is_bestseller": False, "is_out_of_stock": False,
        "pricing_mode": "catalog", "price_formula": formula,
        # backend/src/orders/order-flow.config.ts: хэвлэл → файл шалгалт, хаяг → газар дээр хэмжилт
        "order_flow": "standard" if t.get("external") else ("site_survey" if t["catSlug"] == "signage" else "file_upload"),
        "requires_file_upload": not t.get("external"),
        "requires_dimensions": "m2" in units,
        "requires_quote_approval": False,
        "compare_specs": {"Ангилал": t["cat"], "Сонголт": f"{len(main)} төрөл", "Үнэ": "НӨАТ орсон"},
    })

cats_sql = [{"name": s.replace("-", " ").title(), "name_mn": c, "slug": s, "sort_order": i + 1,
             "is_active": True, "show_in_menu": True} for i, (c, s) in enumerate(CATEGORIES)]

def lit(x):
    return "$bp$" + json.dumps(x, ensure_ascii=False) + "$bp$"

sql = f"""-- Дэлгүүрийн бараа: сайтын албан үнийн жагсаалт ({VERSION}).
-- scripts/build-shop-catalog.py үүсгэсэн — гараар бүү засаарай; үнэ өөрчлөгдвөл шинэ файл үүсгэнэ.
--
-- 1) Хуучин бүх барааг is_active=false болгоно (устгахгүй: захиалгын түүх, холбоос хэвээр).
--    Дизайны загварт холбогдсон (template_id-тай) барааг оролдохгүй.
-- 2) 12 ангилал, {len(products)} бүтээгдэхүүнийг slug-аар upsert хийнэ.
-- Production-ийн баганын бүрэлдэхүүн entity-ээс зөрж болох тул зөвхөн байгаа баганад бичнэ.

CREATE OR REPLACE FUNCTION pg_temp.bp_upsert(tbl text, data jsonb, key_cols text[]) RETURNS void AS $f$
DECLARE cols text; upd text; matched int; cond text;
BEGIN
  SELECT string_agg(quote_ident(c.column_name), ',' ORDER BY c.ordinal_position),
         string_agg(format('%1$I = s.%1$I', c.column_name), ',' ORDER BY c.ordinal_position)
    INTO cols, upd
    FROM information_schema.columns c
   WHERE c.table_schema = current_schema() AND c.table_name = tbl AND data ? c.column_name;
  -- key_cols-оос аль нэгээр нь таарсан мөрийг шинэчилнэ (slug, дараа нь name гэх мэт)
  FOR i IN 1 .. array_length(key_cols, 1) LOOP
    IF NOT (data ? key_cols[i]) THEN CONTINUE; END IF;
    cond := format('t.%1$I = s.%1$I', key_cols[i]);
    EXECUTE format('UPDATE %1$I t SET %2$s FROM (SELECT * FROM jsonb_populate_record(NULL::%1$I, $1)) s WHERE %3$s',
                   tbl, upd, cond) USING data;
    GET DIAGNOSTICS matched = ROW_COUNT;
    IF matched > 0 THEN RETURN; END IF;
  END LOOP;
  EXECUTE format('INSERT INTO %1$I (%2$s) SELECT %2$s FROM jsonb_populate_record(NULL::%1$I, $1)', tbl, cols) USING data;
EXCEPTION WHEN unique_violation OR not_null_violation OR check_violation THEN
  -- Нэг мөрийн зөрчил backend-ийн ачааллыг зогсоохгүй — анхааруулаад үргэлжилнэ
  RAISE WARNING 'bp_upsert % (%): %', tbl, data->>'slug', SQLERRM;
END $f$ LANGUAGE plpgsql;

UPDATE products SET is_active = false
 WHERE template_id IS NULL AND (sku IS NULL OR sku NOT LIKE 'BPS-%');

UPDATE categories SET is_active = false, show_in_menu = false
 WHERE slug IS NULL OR slug NOT IN ({", ".join("'" + s + "'" for _, s in CATEGORIES)});
"""
for c in cats_sql:
    sql += f"SELECT pg_temp.bp_upsert('categories', {lit(c)}::jsonb, ARRAY['slug','name_mn','name']);\n"
for p in products:
    sql += f"SELECT pg_temp.bp_upsert('products', {lit(p)}::jsonb, ARRAY['slug']);\n"

MIGR_DIR.mkdir(parents=True, exist_ok=True)
for old in sorted(MIGR_DIR.glob("*-shop-catalog-*.sql")):
    if old.name != MIGR_NAME and old.read_text(encoding="utf-8") == sql:
        print(f"{old.name} ижил агуулгатай — шинэ migration үүсгэхгүй"); break
else:
    (MIGR_DIR / MIGR_NAME).write_text(sql, encoding="utf-8")
print(f"{MIGR_DIR / MIGR_NAME}: {len(products)} бүтээгдэхүүн, {len(cats_sql)} ангилал")
if problems:
    print("Анхаарах:"); [print("  -", p) for p in problems]

# --- Facebook каталогийн feed (сайтын холбоосыг барааны хуудас руу заана) ----------------
# Албан feed-ийн бусад талбарыг өөрчлөхгүй; зөвхөн link-ийг шинэ дэлгүүрийн хуудас руу,
# үнэ нь каталогтай таарч байгааг шалгана.
if len(sys.argv) > 2:
    import csv, io
    src = Path(sys.argv[2])
    rows = list(csv.DictReader(io.open(src, encoding="utf-8-sig")))
    slug_of = {c: t["slug"] for t in type_list for c in t["codes"] + t.get("addons", [])}
    out, bad = [], []
    for r in rows:
        base = re.match(r"^([A-Z]{2}-\d+)", r["id"]).group(1)
        slug = slug_of.get(base)
        if not slug:
            bad.append(r["id"]); continue
        r["link"] = f"https://www.bizprint.mn/product/{slug}?code={base}"
        out.append(r)
    dst = ROOT / "public" / "feeds" / "facebook-catalog.csv"
    dst.parent.mkdir(parents=True, exist_ok=True)
    with io.open(dst, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(out)
    print(f"{dst}: {len(out)} мөр" + (f", холбоосгүй: {bad}" if bad else ""))
