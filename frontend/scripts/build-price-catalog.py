#!/usr/bin/env python3
"""
bizprint-ийн албан ёсны үнийн Excel-ээс сайтын тооцоолуурын өгөгдөл үүсгэнэ.

  python scripts/build-price-catalog.py "<зам>/bizprint-alban-yosny-une-v6.xlsx"

Гаралт: lib/pricing/catalog.json — ЗӨВХӨН үйлчлүүлэгчид харагдах үнэ.
Excel-ийн өртөг, маржин, нийлүүлэгч, төлөвийн мэдээлэл JSON-д ОРОХГҮЙ.
Excel файлыг өөрийг нь repo-д commit хийхгүй (дотоод мэдээлэлтэй).
"""
import json, re, sys
from pathlib import Path
import openpyxl

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "lib" / "pricing" / "catalog.json"

wb = openpyxl.load_workbook(SRC, data_only=True)

def clean(s):
    return re.sub(r"\s+", " ", str(s)).strip().rstrip(".") if s not in (None, "") else ""

# --- Ангиллыг нэгтгэх --------------------------------------------------------
CAT_MAP = {
    "Туг далбаа (багц үнэ)": "Туг далбаа",
    "Хавтан хэвлэл": "Өргөн хэвлэл",
    "Стикер": "Өргөн хэвлэл",
    "Зураг угаалт": "Зураг, альбум",
    "Альбум ном": "Зураг, альбум",
    "Бусад / Промо": "Промо, бэлэг",
    "Промо бүтээгдэхүүн": "Промо, бэлэг",
    "Шагналын бүтээгдэхүүн": "Шагнал, үнэмлэх",
    "Карт үнэмлэх": "Шагнал, үнэмлэх",
    "Самбар заагч": "Шагнал, үнэмлэх",
    "Тусгай (үнийн саналаас)": "Тусгай захиалга",
}
def manual_cat(name):  # «Гар бичмэл хуудас» — бараагаар нь ангилна
    n = name.lower()
    if "хаалганы" in n: return "Шагнал, үнэмлэх"
    if "dtf" in n: return "Даавуун хэвлэл"
    if "стикер" in n: return "Өргөн хэвлэл"
    return "Офсет хэвлэл"

CAT_ORDER = ["Офсет хэвлэл", "Өргөн хэвлэл", "Туг далбаа", "Хаяг реклам", "Даавуун хэвлэл",
             "Промо, бэлэг", "Ном, сэтгүүл", "Зураг, альбум", "Шагнал, үнэмлэх", "Тусгай захиалга"]

def delivery_class(s):
    s = clean(s)
    if s.startswith("Суурилуулалттай"): return "INSTALL"
    return s[:2].strip() if s[:2].strip() in ("S", "M", "L", "XL") else "M"

def unit_of(u, cat_raw, code):
    u = clean(u)
    if code in UNIT_OVERRIDE: return UNIT_OVERRIDE[code]
    if u in ("мкв", "м²"): return "m2"
    if u == "багц": return "pack"
    if u == "м" and cat_raw == "Гар бичмэл хуудас": return "lm"  # гүйлтийн метр (DTF)
    return "pcs"

# Excel-ийн нэгж нь бараатай зөрсөн мөрүүд (тайлбарыг доор)
UNIT_OVERRIDE = {
    "BP-043": "pcs",  # «Дотор тавган суурьтай» суурь — мкв гэж бичигдсэн ч ширхгийн бараа
}

# Олс, бөгж нэмэлт (Стандарт хэмжээ хуудас): 2,500₮/м² НӨАТ-гүй — хулдаасан баннерт
ROPE_CODES = {"BP-005", "BP-006", "BP-007", "BP-008", "BP-009"}
ROPE_PER_M2 = 2500

# --- Үндсэн жагсаалт ---------------------------------------------------------
ws = wb["Үнийн жагсаалт"]
hdr = [clean(c.value) for c in ws[2]]
col = {h: i for i, h in enumerate(hdr)}
items = []
for r in ws.iter_rows(min_row=3, values_only=True):
    code = clean(r[col["Код"]])
    if not code or r[col["ҮНЭ, ₮ НӨАТ-гүй"]] in (None, ""): continue
    cat_raw = clean(r[col["Ангилал"]])
    name = clean(r[col["Бүтээгдэхүүн"]])
    variant = clean(r[col["Хувилбар / хэмжээ"]])
    cat = manual_cat(name) if cat_raw == "Гар бичмэл хуудас" else CAT_MAP.get(cat_raw, cat_raw)
    if " — " in name:
        family, option = name.split(" — ", 1)
    else:
        family, option = name, ""
    unit = unit_of(r[col["Нэгж"]], cat_raw, code)
    pack = r[col["Тираж"]]
    if unit == "pack":
        option = option or variant
    elif variant and variant not in (option, family):
        option = (option + " · " + variant).strip(" ·") if option else variant
    items.append({
        "code": code, "cat": cat, "family": clean(family), "option": clean(option),
        "spec": clean(r[col["Материал / тодорхойлолт"]]),
        "unit": unit, "pack": int(pack) if isinstance(pack, (int, float)) else None,
        "ex": int(r[col["ҮНЭ, ₮ НӨАТ-гүй"]]), "inc": int(r[col["ҮНЭ, ₮ НӨАТ-тай"]]),
        "delivery": delivery_class(r[col["Хүргэлтийн ангилал"]]),
        "rope": ROPE_PER_M2 if code in ROPE_CODES else 0,
        "about": clean(r[col["ТОВЧ ТАЙЛБАР"]]) if "ТОВЧ ТАЙЛБАР" in col else "",
        "needs": clean(r[col["Захиалахад шаардлагатай"]]) if "Захиалахад шаардлагатай" in col else "",
    })

# --- Нэр, сонголтыг цэгцлэх ------------------------------------------------------
FAMILY_RULES = [  # нэг төрлийн олон бараа → нэг бүтээгдэхүүн, олон сонголт
    (r"^(Биет үсэг)\s*(.+)$", None), (r"^(Сайжруулсан төмөр)\s*(.+)$", "Сайжруулсан төмөр самбар"),
    (r"^(Хөнгөн цагаан хайлш)\s*(.+)$", "Хөнгөн цагаан хайлш самбар"), (r"^(DTF хэвлэл)\s*(.+)$", None),
    (r"^(UV-DTF хэвлэл)\s*(.+)$", None), (r"^(Цонхны хуулга)\s*(.+)$", None),
    (r"^(Лайтбокс)\s*(.+)$", None), (r"^(Зураг угаалт)\s*(.+)$", None), (r"^(Альбум ном)\s*(.+)$", None),
    (r"^(Акрил|PVC|Пластик) меню А4$", "Меню А4"),
]
FAMILY_RENAME = {"Стандарт": "Байгууллагын туг 2×1м (иж бүрдэл)",
                 "Реклам зар сурталчилгааны Г хэлбэрийн туг": "Г хэлбэрийн туг",
                 "Суурь иш": "Тугны суурь, иш"}
GENERIC_VARIANTS = {"UV технологи", "Стандарт", "Зүсэлттэй", "Хэвлэлтэй", "Дотор туг", "Гадна туг",
                    "Гадна уян туг", "Ширээний туг", "Дарцаг", "1 ш"}
DROP_CODES = {"BP-199"}  # «Шаазан аяга» — Промо хуудсанд шатлалын үнэтэй (PR-05)

items = [it for it in items if it["code"] not in DROP_CODES]
last_size = {}
for it in items:
    fam, opt = it["family"], it["option"]
    for pat, newfam in FAMILY_RULES:
        m = re.match(pat, fam)
        if m:
            if newfam == "Меню А4":
                fam, opt = "Меню А4", m.group(1)
            else:
                fam = newfam or m.group(1)
                rest = m.group(2).strip()
                opt = (rest + (" · " + opt if opt else "")).strip()
            break
    fam = FAMILY_RENAME.get(fam, fam)
    # «Хувилбар» багана: ерөнхий үг бол хаяна, давхардвал нэгийг нь үлдээнэ
    parts = [p.strip() for p in opt.split(" · ") if p.strip()]
    if len(parts) == 2:
        a, b = parts
        if b in GENERIC_VARIANTS: parts = [a]
        elif a.lower() in b.lower(): parts = [b]
        elif b.lower() in a.lower(): parts = [a]
    opt = " · ".join(p for p in parts if p not in GENERIC_VARIANTS)
    # Хэмжээгүй «Суурьтай» мөр нь өмнөх мөрийн хэмжээг өвлөнө (2х1, 3х1, 2.5х1)
    sm = re.match(r"^(\d[\d.,]*х\d[\d.,]*)", opt)
    if sm: last_size[fam] = sm.group(1)
    elif it["unit"] == "pcs" and opt in ("Суурьтай", "Суурьгүй") and fam in last_size:
        opt = f"{last_size[fam]} {opt}"
    it["family"], it["option"] = fam, opt

# Багцын бараанд option-ыг тиражгүйгээр бүлэглэнэ (жишээ: «300гр, Энгийн» → 200/500/1000ш)
for it in items:
    if it["unit"] == "pack":
        it["option"] = re.sub(r"\s*\d+\s*(ширхэгийн багц|ш)\s*$", "", it["option"]).strip()
        if re.fullmatch(r"\d+\s*(ширхэгийн багц|ш)", it["option"] or ""):
            it["option"] = ""

# --- Промо бараа (тоо ширхгийн шатлал) ------------------------------------------
ws = wb["Промо бараа"]
DELIV_BY_FEE = {10000: "S", 15000: "M", 20000: "L"}
promo = []
for r in ws.iter_rows(min_row=3, values_only=True):
    code = clean(r[0])
    if not code.startswith("PR-"): continue
    vals = list(r)
    # PR-17-д «Тодорхойлолт» хоосон тул багана нэгээр шилжсэн
    if not isinstance(vals[3], (int, float)):
        pass
    if isinstance(vals[2], (int, float)):
        vals = vals[:2] + [""] + vals[2:]
    tiers = [{"min": m, "ex": int(vals[i])} for m, i in ((10, 6), (50, 7), (300, 8), (1000, 9))]
    promo.append({
        "code": code, "cat": "Промо, бэлэг", "family": clean(vals[1]), "option": "",
        "spec": clean(vals[2]), "unit": "tier", "tiers": tiers, "min": 10,
        "delivery": DELIV_BY_FEE.get(int(vals[10] or 15000), "M"), "rope": 0, "about": "", "needs": "",
    })

# --- Ном, сэтгүүл ---------------------------------------------------------------
ws = wb["Ном, сэтгүүл"]
TIRAGES = [200, 300, 500, 1000, 3000, 5000]
books = []
for r in ws.iter_rows(min_row=3, values_only=True):
    code = clean(r[0])
    if not code.startswith("BK-"): continue
    books.append({
        "code": code, "size": clean(r[1]), "paper": clean(r[2]), "pages": int(r[3]),
        "binding": clean(r[4]),
        "tiers": [{"min": t, "ex": int(r[5 + i])} for i, t in enumerate(TIRAGES)],
    })

# --- Стандарт хэмжээ (м² бараанд бэлэн хэмжээ) --------------------------------
ws = wb["Стандарт хэмжээ"]
presets = {}
for r in ws.iter_rows(min_row=3, values_only=True):
    code = clean(r[0]); size = clean(r[2])
    m = re.match(r"([\d.]+)\s*×\s*([\d.]+)", size)
    if not code.startswith("BP-") or not m: continue
    presets.setdefault(code, []).append([float(m.group(1)), float(m.group(2))])

# --- Хүргэлт --------------------------------------------------------------------
ws = wb["Хүргэлтийн бүс"]
locations = []
for r in ws.iter_rows(min_row=3, values_only=True):
    if not r[0] or not str(r[4] or "").strip().isdigit(): continue
    locations.append({"name": clean(r[0]), "district": clean(r[1]), "zone": int(r[4])})

delivery = {
    "base": {"S": 10000, "M": 15000, "L": 20000, "XL": 25000},
    "zoneAdd": {"1": 0, "2": 5000, "3": 10000, "4": 15000},
    "max": 25000,
    "countryside": "Аймаг, сум руу: унаа эсвэл каргоны цэг хүртэл Бүс 1-ийн тарифаар",
    "pickup": "Логос Төв 7 давхар, 701 тоот — өөрөө ирж авбал хүргэлтгүй",
    "time": "Хэвлэгдэж дууссанаас хойш 1–2 хоногт",
    "locations": locations,
}

catalog = {
    "version": "v6 · 2026-11-22",
    "vatRate": 0.10,
    "categories": [c for c in CAT_ORDER if any(i["cat"] == c for i in items + promo) or c == "Ном, сэтгүүл"],
    "items": items + promo,
    "books": books,
    "presets": presets,
    "delivery": delivery,
}
OUT.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{OUT}: {len(items)} бараа, {len(promo)} промо, {len(books)} ном, {len(locations)} байршил")

# --- Нүүр хуудасны «түгээмэл захиалга» (catalog.json-ыг нүүр хуудсанд ачаалахгүйн тулд) ---
VAT = 1.10
byc = {it["code"]: it for it in catalog["items"]}
def inc(x): return round(x * VAT)
popular = []
def add(code, title, calc, total_ex):
    popular.append({"code": code, "title": title, "calc": calc, "inc": inc(total_ex)})
it = byc["BP-077"]; add("BP-077", "Нэрийн хуудас 500ш", f"300гр, энгийн · {it['pack']}ш багц", it["ex"])
it = byc["BP-007"]; add("BP-007", "Бельги баннер 1×3 м", f"3 м² × {inc(it['ex']):,}₮ + олс, бөгж", (it["ex"] + it["rope"]) * 3)
it = byc["BP-001"]; add("BP-001", "X баннер стенд", "160×60 см, хүрээ + хэвлэл", it["ex"])
it = byc["BP-056"]; add("BP-056", "Байгууллагын туг 2×1 м", "Суурьтай иж бүрдэл", it["ex"])
pen = byc.get("PR-01")
if pen:
    t = [x for x in pen["tiers"] if x["min"] <= 100][-1]
    add("PR-01", "Логотой үзэг 100ш", f"100 × {inc(t['ex']):,}₮", t["ex"] * 100)
POP = OUT.with_name("popular.json")
POP.write_text(json.dumps({"version": catalog["version"], "items": popular}, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"{POP}: {len(popular)} жишээ")
