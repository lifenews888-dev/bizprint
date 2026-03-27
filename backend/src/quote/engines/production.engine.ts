/* ═══════════════════════════════════════
 *  Production Engine — үйлдвэрлэлийн симуляци
 *  Цаг + зардал + алхам
 * ═══════════════════════════════════════ */

import { MaterialResult } from './material.engine';
import { MachineResult } from './machine.engine';

export interface ProductionStep {
  step: string;
  description: string;
  time_hours: number;
  cost: number;
}

export interface ProductionResult {
  steps: ProductionStep[];
  total_time_hours: number;
  estimated_days: number;
  machine_cost: number;
  labor_cost: number;
  setup_cost: number;
  post_process_cost: number;
  total_production_cost: number;
}

// Post-process үнэ (₮/м² эсвэл per unit)
const POST_PROCESS: Record<string, { name: string; cost_per_m2: number }> = {
  led: { name: 'LED гэрэлтүүлэг', cost_per_m2: 150000 },
  painting: { name: 'Будаг', cost_per_m2: 15000 },
  lamination_matt: { name: 'Мат ламинаци', cost_per_m2: 3000 },
  lamination_gloss: { name: 'Гянт ламинаци', cost_per_m2: 2500 },
  uv_coating: { name: 'UV хамгаалалт', cost_per_m2: 5000 },
  mounting: { name: 'Суурилуулалт', cost_per_m2: 50000 },
};

// Хөдөлмөрийн зардал (₮/цаг)
const LABOR_RATE = 15000; // ₮/цаг

export class ProductionEngine {
  static simulate(
    material: MaterialResult,
    machine: MachineResult,
    input: {
      quantity: number;
      post_processes?: string[];
      has_led?: boolean;
      urgency?: string;
    },
  ): ProductionResult {
    const steps: ProductionStep[] = [];
    const area = material.area_m2;

    // Step 1: Setup
    const setupHours = machine.setup_time_min / 60;
    steps.push({
      step: 'setup',
      description: `${machine.machine_name} тохируулга`,
      time_hours: setupHours,
      cost: machine.setup_cost,
    });

    // Step 2: Cutting / Printing
    const cuttingHours = Math.max(area / machine.speed_m2_per_hour, 0.25);
    const machineCost = Math.round(cuttingHours * machine.hourly_rate);
    steps.push({
      step: 'production',
      description: `${machine.machine_name} ажиллагаа`,
      time_hours: cuttingHours,
      cost: machineCost,
    });

    // Step 3: Assembly / Labor
    const assemblyHours = Math.max(area * 0.5, 0.5); // 0.5 цаг/м² assembly
    const laborCost = Math.round(assemblyHours * LABOR_RATE);
    steps.push({
      step: 'assembly',
      description: 'Угсралт / гар ажиллагаа',
      time_hours: assemblyHours,
      cost: laborCost,
    });

    // Step 4: Post-process
    let postCost = 0;
    const processes = input.post_processes || [];
    if (input.has_led) processes.push('led');

    for (const proc of processes) {
      const pp = POST_PROCESS[proc];
      if (pp) {
        const cost = Math.round(area * pp.cost_per_m2);
        postCost += cost;
        steps.push({
          step: `post_${proc}`,
          description: pp.name,
          time_hours: area * 0.3,
          cost,
        });
      }
    }

    // Step 5: QC + Packaging
    steps.push({
      step: 'qc',
      description: 'Чанарын хяналт + савлалт',
      time_hours: 0.5,
      cost: 5000,
    });

    // Totals
    const totalTimeHours = steps.reduce((s, st) => s + st.time_hours, 0);
    const workHoursPerDay = 8;
    let estimatedDays = Math.ceil(totalTimeHours / workHoursPerDay);

    // Urgency
    if (input.urgency === '24h') estimatedDays = Math.max(1, Math.ceil(estimatedDays * 0.5));
    else if (input.urgency === '48h') estimatedDays = Math.max(2, Math.ceil(estimatedDays * 0.7));

    return {
      steps,
      total_time_hours: Math.round(totalTimeHours * 10) / 10,
      estimated_days: estimatedDays,
      machine_cost: machineCost,
      labor_cost: laborCost,
      setup_cost: machine.setup_cost,
      post_process_cost: postCost,
      total_production_cost: steps.reduce((s, st) => s + st.cost, 0),
    };
  }
}
