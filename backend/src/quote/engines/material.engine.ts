/* ═══════════════════════════════════════
 *  Material Engine — бодит материалын тооцоо
 *  area × rate + waste factor
 * ═══════════════════════════════════════ */

export interface MaterialResult {
  material_name: string;
  area_m2: number;
  rate_per_m2: number;
  base_cost: number;
  waste_percent: number;
  waste_cost: number;
  total_cost: number;
}

// Бодит материалын үнэ (₮/м²)
const MATERIAL_DB: Record<string, { name: string; rate: number; waste: number }> = {
  // === ХАЯГ РЕКЛАМ ===
  // Акрил
  acrylic_3mm:  { name: 'Акрил 3мм', rate: 45000, waste: 0.15 },
  acrylic_5mm:  { name: 'Акрил 5мм', rate: 55000, waste: 0.15 },
  acrylic_8mm:  { name: 'Акрил 8мм', rate: 75000, waste: 0.15 },
  acrylic_10mm: { name: 'Акрил 10мм', rate: 90000, waste: 0.15 },
  // PVC
  pvc_3mm:  { name: 'PVC 3мм', rate: 25000, waste: 0.12 },
  pvc_5mm:  { name: 'PVC 5мм', rate: 30000, waste: 0.12 },
  pvc_10mm: { name: 'PVC 10мм', rate: 45000, waste: 0.12 },
  // Металл
  steel_1mm:    { name: 'Ган 1мм', rate: 65000, waste: 0.10 },
  steel_2mm:    { name: 'Ган 2мм', rate: 85000, waste: 0.10 },
  stainless:    { name: 'Нерж ган', rate: 120000, waste: 0.10 },
  aluminum_2mm: { name: 'Хөнгөн цагаан 2мм', rate: 95000, waste: 0.10 },
  // Гэрэлт самбар
  lightbox_in:  { name: 'Гэрэлт самбар (дотор)', rate: 280000, waste: 0.08 },
  lightbox_out: { name: 'Гэрэлт самбар (гадна)', rate: 380000, waste: 0.08 },
  // Эпокси
  epoxy:        { name: 'Эпокси резин', rate: 650000, waste: 0.20 },
  // === ХЭВЛЭЛ ===
  paper_80:   { name: 'Цаас 80gsm', rate: 800, waste: 0.05 },
  paper_100:  { name: 'Цаас 100gsm', rate: 1000, waste: 0.05 },
  paper_150:  { name: 'Цаас 150gsm', rate: 1500, waste: 0.05 },
  paper_200:  { name: 'Цаас 200gsm', rate: 2000, waste: 0.05 },
  paper_300:  { name: 'Цаас 300gsm', rate: 3000, waste: 0.05 },
  // === ӨРГӨН ХЭВЛЭЛ ===
  vinyl:      { name: 'Винил', rate: 8000, waste: 0.10 },
  mesh:       { name: 'Mesh баннер', rate: 6000, waste: 0.10 },
  canvas:     { name: 'Даавуу (canvas)', rate: 22000, waste: 0.10 },
  backlit:    { name: 'Backlit film', rate: 15000, waste: 0.10 },
  sticker:    { name: 'Стикер', rate: 12000, waste: 0.10 },
};

export class MaterialEngine {
  static calculate(input: {
    material: string;
    width_mm: number;
    height_mm: number;
    quantity: number;
  }): MaterialResult {
    const mat = MATERIAL_DB[input.material] || MATERIAL_DB.acrylic_5mm;
    const area = (input.width_mm / 1000) * (input.height_mm / 1000);
    const totalArea = area * input.quantity;
    const baseCost = Math.round(totalArea * mat.rate);
    const wasteCost = Math.round(baseCost * mat.waste);

    return {
      material_name: mat.name,
      area_m2: Math.round(totalArea * 1000) / 1000,
      rate_per_m2: mat.rate,
      base_cost: baseCost,
      waste_percent: mat.waste * 100,
      waste_cost: wasteCost,
      total_cost: baseCost + wasteCost,
    };
  }

  static getMaterials() {
    return Object.entries(MATERIAL_DB).map(([key, val]) => ({
      key, name: val.name, rate: val.rate, waste: val.waste * 100,
    }));
  }
}
