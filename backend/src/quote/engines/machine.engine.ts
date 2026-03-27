/* ═══════════════════════════════════════
 *  Machine Engine — машин сонголт + цаг тооцоо
 * ═══════════════════════════════════════ */

export interface MachineResult {
  machine_name: string;
  machine_type: string;
  speed_m2_per_hour: number;
  hourly_rate: number;
  setup_time_min: number;
  setup_cost: number;
  max_width_mm: number;
  max_height_mm: number;
}

// Бодит машинуудын мэдээлэл
const MACHINE_DB: Record<string, MachineResult> = {
  cnc_router: {
    machine_name: 'CNC Router (хаяг)',
    machine_type: 'cnc',
    speed_m2_per_hour: 2,
    hourly_rate: 80000,
    setup_time_min: 30,
    setup_cost: 15000,
    max_width_mm: 2400,
    max_height_mm: 1200,
  },
  laser_cutter: {
    machine_name: 'Laser Cutter',
    machine_type: 'laser',
    speed_m2_per_hour: 0.8,
    hourly_rate: 60000,
    setup_time_min: 15,
    setup_cost: 8000,
    max_width_mm: 1300,
    max_height_mm: 900,
  },
  cnc_metal: {
    machine_name: 'CNC Metal (нерж/ган)',
    machine_type: 'cnc_metal',
    speed_m2_per_hour: 0.5,
    hourly_rate: 120000,
    setup_time_min: 45,
    setup_cost: 25000,
    max_width_mm: 3000,
    max_height_mm: 1500,
  },
  uv_printer: {
    machine_name: 'UV Printer',
    machine_type: 'uv_print',
    speed_m2_per_hour: 5,
    hourly_rate: 45000,
    setup_time_min: 10,
    setup_cost: 5000,
    max_width_mm: 2500,
    max_height_mm: 1300,
  },
  offset_press: {
    machine_name: 'Heidelberg Offset',
    machine_type: 'offset',
    speed_m2_per_hour: 50,
    hourly_rate: 150000,
    setup_time_min: 60,
    setup_cost: 50000,
    max_width_mm: 720,
    max_height_mm: 1020,
  },
  digital_press: {
    machine_name: 'Xerox Digital Press',
    machine_type: 'digital',
    speed_m2_per_hour: 20,
    hourly_rate: 40000,
    setup_time_min: 5,
    setup_cost: 3000,
    max_width_mm: 330,
    max_height_mm: 488,
  },
  wide_format: {
    machine_name: 'Roland Wide Format',
    machine_type: 'wide',
    speed_m2_per_hour: 8,
    hourly_rate: 35000,
    setup_time_min: 10,
    setup_cost: 5000,
    max_width_mm: 3200,
    max_height_mm: 50000, // roll
  },
  led_assembly: {
    machine_name: 'LED гэрэлтүүлэг угсралт',
    machine_type: 'led',
    speed_m2_per_hour: 1,
    hourly_rate: 50000,
    setup_time_min: 20,
    setup_cost: 10000,
    max_width_mm: 5000,
    max_height_mm: 3000,
  },
};

// Материал → Машин mapping
const MATERIAL_MACHINE_MAP: Record<string, string> = {
  acrylic_3mm: 'laser_cutter', acrylic_5mm: 'laser_cutter',
  acrylic_8mm: 'cnc_router', acrylic_10mm: 'cnc_router',
  pvc_3mm: 'cnc_router', pvc_5mm: 'cnc_router', pvc_10mm: 'cnc_router',
  steel_1mm: 'cnc_metal', steel_2mm: 'cnc_metal',
  stainless: 'cnc_metal', aluminum_2mm: 'cnc_metal',
  lightbox_in: 'uv_printer', lightbox_out: 'uv_printer',
  epoxy: 'cnc_router',
  paper_80: 'digital_press', paper_100: 'digital_press',
  paper_150: 'offset_press', paper_200: 'offset_press', paper_300: 'offset_press',
  vinyl: 'wide_format', mesh: 'wide_format', canvas: 'wide_format',
  backlit: 'wide_format', sticker: 'wide_format',
};

export class MachineEngine {
  static select(material: string, quantity: number): MachineResult {
    // Paper: qty < 200 → digital, else offset
    if (material.startsWith('paper_')) {
      return quantity < 200 ? MACHINE_DB.digital_press : MACHINE_DB.offset_press;
    }
    const key = MATERIAL_MACHINE_MAP[material] || 'cnc_router';
    return MACHINE_DB[key];
  }

  static getMachines() {
    return Object.entries(MACHINE_DB).map(([key, val]) => ({ key, ...val }));
  }
}
