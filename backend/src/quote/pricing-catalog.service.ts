import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CatalogMaterial, CatalogMachine, CatalogFinishing,
  CatalogMarginRule, CatalogMaterialMachineMap, CatalogLetterPrice,
} from './entities/pricing-catalog.entity';

/* ═══════════════════════════════════════
 *  Pricing Catalog Service
 *  DB-backed material, machine, finishing, margin data
 *  Seeds default data on first run
 * ═══════════════════════════════════════ */

@Injectable()
export class PricingCatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(CatalogMaterial) private materialRepo: Repository<CatalogMaterial>,
    @InjectRepository(CatalogMachine) private machineRepo: Repository<CatalogMachine>,
    @InjectRepository(CatalogFinishing) private finishingRepo: Repository<CatalogFinishing>,
    @InjectRepository(CatalogMarginRule) private marginRepo: Repository<CatalogMarginRule>,
    @InjectRepository(CatalogMaterialMachineMap) private mapRepo: Repository<CatalogMaterialMachineMap>,
    @InjectRepository(CatalogLetterPrice) private letterRepo: Repository<CatalogLetterPrice>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.materialRepo.count();
      if (count === 0) await this.seedAll();
    } catch {
      console.warn('PricingCatalog: tables not ready yet, skipping seed');
    }
  }

  /* ═══════════════════════════════════════
   *  MATERIAL CRUD
   * ═══════════════════════════════════════ */

  async getMaterials(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    return this.materialRepo.find({ where, order: { category: 'ASC', sort_order: 'ASC' } });
  }

  async getMaterial(id: string) {
    return this.materialRepo.findOneBy({ id });
  }

  async getMaterialByKey(key: string) {
    return this.materialRepo.findOneBy({ key });
  }

  async createMaterial(data: Partial<CatalogMaterial>) {
    return this.materialRepo.save(this.materialRepo.create(data));
  }

  async updateMaterial(id: string, data: Partial<CatalogMaterial>) {
    await this.materialRepo.update(id, data);
    return this.materialRepo.findOneBy({ id });
  }

  async deleteMaterial(id: string) {
    return this.materialRepo.delete(id);
  }

  /* ═══════════════════════════════════════
   *  MACHINE CRUD
   * ═══════════════════════════════════════ */

  async getMachines(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    return this.machineRepo.find({ where, order: { sort_order: 'ASC' } });
  }

  async getMachine(id: string) {
    return this.machineRepo.findOneBy({ id });
  }

  async getMachineByKey(key: string) {
    return this.machineRepo.findOneBy({ key });
  }

  async createMachine(data: Partial<CatalogMachine>) {
    return this.machineRepo.save(this.machineRepo.create(data));
  }

  async updateMachine(id: string, data: Partial<CatalogMachine>) {
    await this.machineRepo.update(id, data);
    return this.machineRepo.findOneBy({ id });
  }

  async deleteMachine(id: string) {
    return this.machineRepo.delete(id);
  }

  /* ═══════════════════════════════════════
   *  FINISHING CRUD
   * ═══════════════════════════════════════ */

  async getFinishings(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    return this.finishingRepo.find({ where, order: { sort_order: 'ASC' } });
  }

  async createFinishing(data: Partial<CatalogFinishing>) {
    return this.finishingRepo.save(this.finishingRepo.create(data));
  }

  async updateFinishing(id: string, data: Partial<CatalogFinishing>) {
    await this.finishingRepo.update(id, data);
    return this.finishingRepo.findOneBy({ id });
  }

  async deleteFinishing(id: string) {
    return this.finishingRepo.delete(id);
  }

  /* ═══════════════════════════════════════
   *  MARGIN RULE CRUD
   * ═══════════════════════════════════════ */

  async getMarginRules(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    return this.marginRepo.find({ where, order: { sort_order: 'ASC' } });
  }

  async getMarginByKey(key: string) {
    return this.marginRepo.findOneBy({ key });
  }

  async createMarginRule(data: Partial<CatalogMarginRule>) {
    return this.marginRepo.save(this.marginRepo.create(data));
  }

  async updateMarginRule(id: string, data: Partial<CatalogMarginRule>) {
    await this.marginRepo.update(id, data);
    return this.marginRepo.findOneBy({ id });
  }

  async deleteMarginRule(id: string) {
    return this.marginRepo.delete(id);
  }

  /* ═══════════════════════════════════════
   *  MATERIAL → MACHINE MAPPING CRUD
   * ═══════════════════════════════════════ */

  async getMappings() {
    return this.mapRepo.find({ where: { is_active: true }, order: { priority: 'DESC' } });
  }

  async createMapping(data: Partial<CatalogMaterialMachineMap>) {
    return this.mapRepo.save(this.mapRepo.create(data));
  }

  async updateMapping(id: string, data: Partial<CatalogMaterialMachineMap>) {
    await this.mapRepo.update(id, data);
    return this.mapRepo.findOneBy({ id });
  }

  async deleteMapping(id: string) {
    return this.mapRepo.delete(id);
  }

  /* ═══════════════════════════════════════
   *  LETTER PRICE CRUD
   * ═══════════════════════════════════════ */

  async getLetterPrices() {
    return this.letterRepo.find({ where: { is_active: true }, order: { size_cm: 'ASC' } });
  }

  async createLetterPrice(data: Partial<CatalogLetterPrice>) {
    return this.letterRepo.save(this.letterRepo.create(data));
  }

  async updateLetterPrice(id: string, data: Partial<CatalogLetterPrice>) {
    await this.letterRepo.update(id, data);
    return this.letterRepo.findOneBy({ id });
  }

  async deleteLetterPrice(id: string) {
    return this.letterRepo.delete(id);
  }

  /* ═══════════════════════════════════════
   *  ENGINE HELPERS — DB-backed lookups
   * ═══════════════════════════════════════ */

  /** Calculate material cost from DB */
  async calculateMaterial(materialKey: string, widthMm: number, heightMm: number, quantity: number) {
    const mat = await this.materialRepo.findOneBy({ key: materialKey, is_active: true });
    if (!mat) return null;

    const area = (widthMm / 1000) * (heightMm / 1000);
    const totalArea = area * quantity;
    const rate = Number(mat.rate_per_m2);
    const waste = Number(mat.waste_factor);
    const baseCost = Math.round(totalArea * rate);
    const wasteCost = Math.round(baseCost * waste);

    return {
      material_name: mat.name,
      material_key: mat.key,
      category: mat.category,
      area_m2: Math.round(totalArea * 1000) / 1000,
      rate_per_m2: rate,
      base_cost: baseCost,
      waste_percent: waste * 100,
      waste_cost: wasteCost,
      total_cost: baseCost + wasteCost,
    };
  }

  /** Select machine from DB mapping */
  async selectMachine(materialKey: string, quantity: number) {
    // Find mapping for this material + quantity range
    const mappings = await this.mapRepo.find({
      where: { material_key: materialKey, is_active: true },
      order: { priority: 'DESC' },
    });

    let machineKey = 'cnc_router'; // fallback
    for (const m of mappings) {
      if (quantity >= m.min_quantity && quantity <= m.max_quantity) {
        machineKey = m.machine_key;
        break;
      }
    }

    const machine = await this.machineRepo.findOneBy({ key: machineKey, is_active: true });
    if (!machine) {
      // fallback to first active machine
      return this.machineRepo.findOne({ where: { is_active: true }, order: { sort_order: 'ASC' } });
    }
    return machine;
  }

  /** Get margin rate from DB */
  async getMarginRate(type: string): Promise<number> {
    const rule = await this.marginRepo.findOneBy({ key: type, is_active: true });
    return rule ? Number(rule.margin_rate) : 0.45;
  }

  /** Get letter price from DB */
  async getLetterPrice(sizeCm: number): Promise<number> {
    const lp = await this.letterRepo.findOneBy({ size_cm: sizeCm, is_active: true });
    return lp ? Number(lp.price_per_letter) : 45000;
  }

  /** Get active finishings as map */
  async getFinishingMap(): Promise<Record<string, { name: string; cost_per_m2: number; time_hours_per_m2: number }>> {
    const items = await this.finishingRepo.find({ where: { is_active: true } });
    const map: Record<string, any> = {};
    for (const f of items) {
      map[f.key] = { name: f.name, cost_per_m2: Number(f.cost_per_m2), time_hours_per_m2: Number(f.time_hours_per_m2) };
    }
    return map;
  }

  /* ═══════════════════════════════════════
   *  AUTO MATERIAL SELECTION (DB-backed)
   * ═══════════════════════════════════════ */

  private static PRODUCT_MATERIAL_MAP: Record<string, string> = {
    nerj: 'stainless', d3: 'acrylic_5mm',
    sambar: 'lightbox_out', pvc: 'pvc_5mm',
    epoxy: 'epoxy', font: 'aluminum_2mm', tmr: 'steel_2mm',
    offset: 'paper_150', digital: 'paper_100',
    wide: 'vinyl',
  };

  async autoSelectMaterial(productType: string): Promise<string> {
    return PricingCatalogService.PRODUCT_MATERIAL_MAP[productType] || 'acrylic_5mm';
  }

  /* ═══════════════════════════════════════
   *  FULL PRODUCTION SIMULATION (DB-backed)
   * ═══════════════════════════════════════ */

  async simulateProduction(
    material: { area_m2: number; total_cost: number },
    machine: CatalogMachine,
    input: { quantity: number; urgency?: string; has_led?: boolean; post_processes?: string[] },
  ) {
    const steps: { step: string; description: string; time_hours: number; cost: number }[] = [];
    const area = material.area_m2;
    const speed = Number(machine.speed_m2_per_hour);
    const hourlyRate = Number(machine.hourly_rate);
    const setupMin = Number(machine.setup_time_min);
    const setupCost = Number(machine.setup_cost);
    const LABOR_RATE = 15000;

    // Step 1: Setup
    const setupHours = setupMin / 60;
    steps.push({ step: 'setup', description: `${machine.name} тохируулга`, time_hours: setupHours, cost: setupCost });

    // Step 2: Production
    const prodHours = Math.max(area / speed, 0.25);
    const machineCost = Math.round(prodHours * hourlyRate);
    steps.push({ step: 'production', description: `${machine.name} ажиллагаа`, time_hours: prodHours, cost: machineCost });

    // Step 3: Assembly
    const assemblyHours = Math.max(area * 0.5, 0.5);
    const laborCost = Math.round(assemblyHours * LABOR_RATE);
    steps.push({ step: 'assembly', description: 'Угсралт / гар ажиллагаа', time_hours: assemblyHours, cost: laborCost });

    // Step 4: Post-processes (from DB)
    let postCost = 0;
    const processes = [...(input.post_processes || [])];
    if (input.has_led) processes.push('led');

    const finishingMap = await this.getFinishingMap();
    for (const proc of processes) {
      const pp = finishingMap[proc];
      if (pp) {
        const cost = Math.round(area * pp.cost_per_m2);
        postCost += cost;
        steps.push({ step: `post_${proc}`, description: pp.name, time_hours: area * pp.time_hours_per_m2, cost });
      }
    }

    // Step 5: QC
    steps.push({ step: 'qc', description: 'Чанарын хяналт + савлалт', time_hours: 0.5, cost: 5000 });

    const totalTimeHours = steps.reduce((s, st) => s + st.time_hours, 0);
    let estimatedDays = Math.ceil(totalTimeHours / 8);

    if (input.urgency === '24h') estimatedDays = Math.max(1, Math.ceil(estimatedDays * 0.5));
    else if (input.urgency === '48h') estimatedDays = Math.max(2, Math.ceil(estimatedDays * 0.7));

    return {
      steps,
      total_time_hours: Math.round(totalTimeHours * 10) / 10,
      estimated_days: estimatedDays,
      machine_cost: machineCost,
      labor_cost: laborCost,
      setup_cost: setupCost,
      post_process_cost: postCost,
      total_production_cost: steps.reduce((s, st) => s + st.cost, 0),
    };
  }

  /* ═══════════════════════════════════════
   *  SEED DEFAULT DATA
   * ═══════════════════════════════════════ */

  private async seedAll() {
    console.log('[PricingCatalog] Seeding default data...');

    // --- Materials ---
    const materials: Partial<CatalogMaterial>[] = [
      // Акрил
      { key: 'acrylic_3mm', name: 'Акрил 3мм', category: 'signage', rate_per_m2: 45000, waste_factor: 0.15, sort_order: 1 },
      { key: 'acrylic_5mm', name: 'Акрил 5мм', category: 'signage', rate_per_m2: 55000, waste_factor: 0.15, sort_order: 2 },
      { key: 'acrylic_8mm', name: 'Акрил 8мм', category: 'signage', rate_per_m2: 75000, waste_factor: 0.15, sort_order: 3 },
      { key: 'acrylic_10mm', name: 'Акрил 10мм', category: 'signage', rate_per_m2: 90000, waste_factor: 0.15, sort_order: 4 },
      // PVC
      { key: 'pvc_3mm', name: 'PVC 3мм', category: 'signage', rate_per_m2: 25000, waste_factor: 0.12, sort_order: 10 },
      { key: 'pvc_5mm', name: 'PVC 5мм', category: 'signage', rate_per_m2: 30000, waste_factor: 0.12, sort_order: 11 },
      { key: 'pvc_10mm', name: 'PVC 10мм', category: 'signage', rate_per_m2: 45000, waste_factor: 0.12, sort_order: 12 },
      // Metal
      { key: 'steel_1mm', name: 'Ган 1мм', category: 'metal', rate_per_m2: 65000, waste_factor: 0.10, sort_order: 20 },
      { key: 'steel_2mm', name: 'Ган 2мм', category: 'metal', rate_per_m2: 85000, waste_factor: 0.10, sort_order: 21 },
      { key: 'stainless', name: 'Нерж ган', category: 'metal', rate_per_m2: 120000, waste_factor: 0.10, sort_order: 22 },
      { key: 'aluminum_2mm', name: 'Хөнгөн цагаан 2мм', category: 'metal', rate_per_m2: 95000, waste_factor: 0.10, sort_order: 23 },
      // Lightbox
      { key: 'lightbox_in', name: 'Гэрэлт самбар (дотор)', category: 'signage', rate_per_m2: 280000, waste_factor: 0.08, sort_order: 30 },
      { key: 'lightbox_out', name: 'Гэрэлт самбар (гадна)', category: 'signage', rate_per_m2: 380000, waste_factor: 0.08, sort_order: 31 },
      // Special
      { key: 'epoxy', name: 'Эпокси резин', category: 'special', rate_per_m2: 650000, waste_factor: 0.20, sort_order: 40 },
      // Paper
      { key: 'paper_80', name: 'Цаас 80gsm', category: 'printing', rate_per_m2: 800, waste_factor: 0.05, sort_order: 50 },
      { key: 'paper_100', name: 'Цаас 100gsm', category: 'printing', rate_per_m2: 1000, waste_factor: 0.05, sort_order: 51 },
      { key: 'paper_150', name: 'Цаас 150gsm', category: 'printing', rate_per_m2: 1500, waste_factor: 0.05, sort_order: 52 },
      { key: 'paper_200', name: 'Цаас 200gsm', category: 'printing', rate_per_m2: 2000, waste_factor: 0.05, sort_order: 53 },
      { key: 'paper_300', name: 'Цаас 300gsm', category: 'printing', rate_per_m2: 3000, waste_factor: 0.05, sort_order: 54 },
      // Wide format
      { key: 'vinyl', name: 'Винил', category: 'wide_format', rate_per_m2: 8000, waste_factor: 0.10, sort_order: 60 },
      { key: 'mesh', name: 'Mesh баннер', category: 'wide_format', rate_per_m2: 6000, waste_factor: 0.10, sort_order: 61 },
      { key: 'canvas', name: 'Даавуу (canvas)', category: 'wide_format', rate_per_m2: 22000, waste_factor: 0.10, sort_order: 62 },
      { key: 'backlit', name: 'Backlit film', category: 'wide_format', rate_per_m2: 15000, waste_factor: 0.10, sort_order: 63 },
      { key: 'sticker', name: 'Стикер', category: 'wide_format', rate_per_m2: 12000, waste_factor: 0.10, sort_order: 64 },
    ];
    for (const m of materials) await this.materialRepo.save(this.materialRepo.create(m));

    // --- Machines ---
    const machines: Partial<CatalogMachine>[] = [
      { key: 'cnc_router', name: 'CNC Router (хаяг)', machine_type: 'cnc', speed_m2_per_hour: 2, hourly_rate: 80000, setup_time_min: 30, setup_cost: 15000, max_width_mm: 2400, max_height_mm: 1200, sort_order: 1 },
      { key: 'laser_cutter', name: 'Laser Cutter', machine_type: 'laser', speed_m2_per_hour: 0.8, hourly_rate: 60000, setup_time_min: 15, setup_cost: 8000, max_width_mm: 1300, max_height_mm: 900, sort_order: 2 },
      { key: 'cnc_metal', name: 'CNC Metal (нерж/ган)', machine_type: 'cnc_metal', speed_m2_per_hour: 0.5, hourly_rate: 120000, setup_time_min: 45, setup_cost: 25000, max_width_mm: 3000, max_height_mm: 1500, sort_order: 3 },
      { key: 'uv_printer', name: 'UV Printer', machine_type: 'uv_print', speed_m2_per_hour: 5, hourly_rate: 45000, setup_time_min: 10, setup_cost: 5000, max_width_mm: 2500, max_height_mm: 1300, sort_order: 4 },
      { key: 'offset_press', name: 'Heidelberg Offset', machine_type: 'offset', speed_m2_per_hour: 50, hourly_rate: 150000, setup_time_min: 60, setup_cost: 50000, max_width_mm: 720, max_height_mm: 1020, sort_order: 5 },
      { key: 'digital_press', name: 'Xerox Digital Press', machine_type: 'digital', speed_m2_per_hour: 20, hourly_rate: 40000, setup_time_min: 5, setup_cost: 3000, max_width_mm: 330, max_height_mm: 488, sort_order: 6 },
      { key: 'wide_format', name: 'Roland Wide Format', machine_type: 'wide', speed_m2_per_hour: 8, hourly_rate: 35000, setup_time_min: 10, setup_cost: 5000, max_width_mm: 3200, max_height_mm: 50000, sort_order: 7 },
      { key: 'led_assembly', name: 'LED гэрэлтүүлэг угсралт', machine_type: 'led', speed_m2_per_hour: 1, hourly_rate: 50000, setup_time_min: 20, setup_cost: 10000, max_width_mm: 5000, max_height_mm: 3000, sort_order: 8 },
    ];
    for (const m of machines) await this.machineRepo.save(this.machineRepo.create(m));

    // --- Finishings ---
    const finishings: Partial<CatalogFinishing>[] = [
      { key: 'led', name: 'LED гэрэлтүүлэг', cost_per_m2: 150000, time_hours_per_m2: 0.3, sort_order: 1 },
      { key: 'painting', name: 'Будаг', cost_per_m2: 15000, time_hours_per_m2: 0.3, sort_order: 2 },
      { key: 'lamination_matt', name: 'Мат ламинаци', cost_per_m2: 3000, time_hours_per_m2: 0.1, sort_order: 3 },
      { key: 'lamination_gloss', name: 'Гянт ламинаци', cost_per_m2: 2500, time_hours_per_m2: 0.1, sort_order: 4 },
      { key: 'uv_coating', name: 'UV хамгаалалт', cost_per_m2: 5000, time_hours_per_m2: 0.15, sort_order: 5 },
      { key: 'mounting', name: 'Суурилуулалт', cost_per_m2: 50000, time_hours_per_m2: 0.5, sort_order: 6 },
      { key: 'cutting', name: 'Зүсэлт', cost_per_m2: 8000, time_hours_per_m2: 0.2, sort_order: 7 },
      { key: 'folding', name: 'Нугалалт', cost_per_m2: 2000, time_hours_per_m2: 0.1, sort_order: 8 },
      { key: 'binding_staple', name: 'Скоб боолт', cost_per_m2: 1500, time_hours_per_m2: 0.05, sort_order: 9 },
      { key: 'binding_perfect', name: 'Perfect боолт', cost_per_m2: 5000, time_hours_per_m2: 0.2, sort_order: 10 },
    ];
    for (const f of finishings) await this.finishingRepo.save(this.finishingRepo.create(f));

    // --- Margin Rules ---
    const margins: Partial<CatalogMarginRule>[] = [
      { key: 'b2b', name: 'B2B / Бөөний', margin_rate: 0.25, description: 'Байгууллагын захиалга', sort_order: 1 },
      { key: 'retail', name: 'Жижиглэн', margin_rate: 0.45, description: 'Хувь хүний захиалга', sort_order: 2 },
      { key: 'rush', name: 'Яаралтай', margin_rate: 0.55, description: 'Яаралтай захиалга (24-48ц)', sort_order: 3 },
      { key: 'wholesale', name: 'Бөөний том', margin_rate: 0.15, description: '100+ ширхэг', sort_order: 4 },
      { key: 'partner', name: 'Түнш', margin_rate: 0.20, description: 'Байнгын түншүүд', sort_order: 5 },
    ];
    for (const m of margins) await this.marginRepo.save(this.marginRepo.create(m));

    // --- Material → Machine Mapping ---
    const mappings: Partial<CatalogMaterialMachineMap>[] = [
      { material_key: 'acrylic_3mm', machine_key: 'laser_cutter', priority: 10 },
      { material_key: 'acrylic_5mm', machine_key: 'laser_cutter', priority: 10 },
      { material_key: 'acrylic_8mm', machine_key: 'cnc_router', priority: 10 },
      { material_key: 'acrylic_10mm', machine_key: 'cnc_router', priority: 10 },
      { material_key: 'pvc_3mm', machine_key: 'cnc_router', priority: 10 },
      { material_key: 'pvc_5mm', machine_key: 'cnc_router', priority: 10 },
      { material_key: 'pvc_10mm', machine_key: 'cnc_router', priority: 10 },
      { material_key: 'steel_1mm', machine_key: 'cnc_metal', priority: 10 },
      { material_key: 'steel_2mm', machine_key: 'cnc_metal', priority: 10 },
      { material_key: 'stainless', machine_key: 'cnc_metal', priority: 10 },
      { material_key: 'aluminum_2mm', machine_key: 'cnc_metal', priority: 10 },
      { material_key: 'lightbox_in', machine_key: 'uv_printer', priority: 10 },
      { material_key: 'lightbox_out', machine_key: 'uv_printer', priority: 10 },
      { material_key: 'epoxy', machine_key: 'cnc_router', priority: 10 },
      // Paper: digital for small qty, offset for large
      { material_key: 'paper_80', machine_key: 'digital_press', min_quantity: 0, max_quantity: 199, priority: 10 },
      { material_key: 'paper_80', machine_key: 'offset_press', min_quantity: 200, max_quantity: 999999, priority: 10 },
      { material_key: 'paper_100', machine_key: 'digital_press', min_quantity: 0, max_quantity: 199, priority: 10 },
      { material_key: 'paper_100', machine_key: 'offset_press', min_quantity: 200, max_quantity: 999999, priority: 10 },
      { material_key: 'paper_150', machine_key: 'offset_press', priority: 10 },
      { material_key: 'paper_200', machine_key: 'offset_press', priority: 10 },
      { material_key: 'paper_300', machine_key: 'offset_press', priority: 10 },
      // Wide format
      { material_key: 'vinyl', machine_key: 'wide_format', priority: 10 },
      { material_key: 'mesh', machine_key: 'wide_format', priority: 10 },
      { material_key: 'canvas', machine_key: 'wide_format', priority: 10 },
      { material_key: 'backlit', machine_key: 'wide_format', priority: 10 },
      { material_key: 'sticker', machine_key: 'wide_format', priority: 10 },
    ];
    for (const m of mappings) await this.mapRepo.save(this.mapRepo.create(m));

    // --- Letter Prices ---
    const letters: Partial<CatalogLetterPrice>[] = [
      { size_cm: 15, price_per_letter: 18000 },
      { size_cm: 20, price_per_letter: 35000 },
      { size_cm: 25, price_per_letter: 40000 },
      { size_cm: 30, price_per_letter: 45000 },
      { size_cm: 40, price_per_letter: 60000 },
      { size_cm: 50, price_per_letter: 75000 },
      { size_cm: 60, price_per_letter: 95000 },
      { size_cm: 70, price_per_letter: 140000 },
      { size_cm: 80, price_per_letter: 180000 },
      { size_cm: 90, price_per_letter: 235000 },
      { size_cm: 100, price_per_letter: 290000 },
    ];
    for (const l of letters) await this.letterRepo.save(this.letterRepo.create(l));

    console.log('[PricingCatalog] Seed complete — 24 materials, 8 machines, 10 finishings, 5 margins, 26 mappings, 11 letter prices');
  }
}
