import { Injectable } from '@nestjs/common';

interface ScheduleInput {
  jobs: Array<{
    id: string;
    orderId: string;
    productType: string;
    quantity: number;
    priority: 'rush' | 'high' | 'normal' | 'low';
    estimatedMinutes?: number;
    paperSize?: string;
    colorMode?: string;
    requiredCapabilities?: string[];
    deadline?: Date;
  }>;
  machines: Array<{
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    capacityPerHour: number;
    isAvailable: boolean;
    currentJobId?: string;
  }>;
}

interface ScheduleResult {
  assignments: Array<{
    jobId: string;
    machineId: string;
    machineName: string;
    startTime: Date;
    estimatedEndTime: Date;
    estimatedMinutes: number;
    score: number;
  }>;
  unscheduled: Array<{ jobId: string; reason: string }>;
  summary: {
    totalJobs: number;
    scheduledJobs: number;
    avgUtilization: number;
    estimatedCompletionTime: Date;
  };
}

@Injectable()
export class ProductionSchedulerService {

  // ── Scheduling algorithm ─────────────────────────
  async schedule(input: ScheduleInput): Promise<ScheduleResult> {
    const assignments: ScheduleResult['assignments'] = [];
    const unscheduled: ScheduleResult['unscheduled'] = [];

    // 1. Sort jobs by priority + deadline
    const sortedJobs = [...input.jobs].sort((a, b) => {
      const priorityScore: Record<string, number> = { rush: 0, high: 1, normal: 2, low: 3 };
      const pDiff = (priorityScore[a.priority] ?? 2) - (priorityScore[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return 0;
    });

    // 2. Track machine availability
    const machineAvailableAt = new Map<string, Date>();
    input.machines
      .filter(m => m.isAvailable)
      .forEach(m => machineAvailableAt.set(m.id, new Date()));

    // 3. Assign each job to best machine
    for (const job of sortedJobs) {
      const estimatedMin = job.estimatedMinutes
        ?? this.estimateMinutes(job.quantity, job.productType);

      const candidates = input.machines
        .filter(m => m.isAvailable && this.canHandle(m, job))
        .map(m => ({
          machine: m,
          availableAt: machineAvailableAt.get(m.id) ?? new Date(),
          score: this.scoreMatch(m, job),
        }))
        .sort((a, b) => {
          if (job.priority === 'rush') {
            return a.availableAt.getTime() - b.availableAt.getTime();
          }
          const aScore = a.score - (a.availableAt.getTime() / 3600000) * 0.1;
          const bScore = b.score - (b.availableAt.getTime() / 3600000) * 0.1;
          return bScore - aScore;
        });

      if (candidates.length === 0) {
        unscheduled.push({
          jobId: job.id,
          reason: job.requiredCapabilities?.length
            ? `Шаардлагатай чадвар (${job.requiredCapabilities.join(', ')}) бүхий machine байхгүй`
            : 'Боломжтой machine байхгүй',
        });
        continue;
      }

      const best = candidates[0];
      const startTime = best.availableAt;
      const endTime = new Date(startTime.getTime() + estimatedMin * 60000);

      assignments.push({
        jobId: job.id,
        machineId: best.machine.id,
        machineName: best.machine.name,
        startTime,
        estimatedEndTime: endTime,
        estimatedMinutes: estimatedMin,
        score: best.score,
      });

      machineAvailableAt.set(best.machine.id, endTime);
    }

    // 4. Summary
    const utilization = this.calcUtilization(assignments, input.machines);
    const lastEnd = assignments.reduce((max, a) =>
      a.estimatedEndTime > max ? a.estimatedEndTime : max,
      new Date(),
    );

    return {
      assignments,
      unscheduled,
      summary: {
        totalJobs: input.jobs.length,
        scheduledJobs: assignments.length,
        avgUtilization: Math.round(utilization),
        estimatedCompletionTime: lastEnd,
      },
    };
  }

  // ── Legacy compat ────────────────────────────────
  scheduleOrders(orders: any[]) {
    let currentTime = 0;
    const schedule: any[] = [];
    for (const order of orders) {
      const duration = Math.ceil(order.quantity / order.machine_speed);
      const start = currentTime;
      const end = start + duration;
      schedule.push({
        order_id: order.id,
        machine_speed: order.machine_speed,
        start_time: this.formatTime(start),
        end_time: this.formatTime(end),
      });
      currentTime = end;
    }
    return { total_orders: orders.length, schedule };
  }

  private formatTime(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // ── Machine capability check ─────────────────────
  private canHandle(
    machine: ScheduleInput['machines'][0],
    job: ScheduleInput['jobs'][0],
  ): boolean {
    if (!job.requiredCapabilities?.length) return true;
    return job.requiredCapabilities.every(cap => machine.capabilities.includes(cap));
  }

  // ── Machine-Job match score ──────────────────────
  private scoreMatch(
    machine: ScheduleInput['machines'][0],
    job: ScheduleInput['jobs'][0],
  ): number {
    let score = 50;

    const typeMap: Record<string, string[]> = {
      vizit_kart: ['offset', 'digital'],
      flyar:      ['offset', 'digital'],
      broushur:   ['offset', 'digital'],
      poster:     ['digital', 'wide_format'],
      banner:     ['wide_format'],
      sticker:    ['digital', 'offset'],
      nom:        ['offset'],
      packaging:  ['offset', 'finishing'],
    };

    const preferred = typeMap[job.productType] ?? [];
    if (preferred.includes(machine.type)) score += 30;

    const estMin = this.estimateMinutes(job.quantity, job.productType);
    const machineMin = (job.quantity / machine.capacityPerHour) * 60;
    if (machineMin <= estMin * 1.2) score += 20;

    return score;
  }

  // ── Estimate job duration (minutes) ──────────────
  private estimateMinutes(quantity: number, productType: string): number {
    const baseMinutesPerK: Record<string, number> = {
      vizit_kart: 15,
      flyar:      20,
      broushur:   30,
      poster:     25,
      banner:     45,
      sticker:    20,
      nom:        60,
      packaging:  90,
    };

    const base = baseMinutesPerK[productType] ?? 30;
    const setup = 20;
    return Math.round(setup + (quantity / 1000) * base);
  }

  // ── Machine utilization ──────────────────────────
  private calcUtilization(
    assignments: ScheduleResult['assignments'],
    machines: ScheduleInput['machines'],
  ): number {
    if (!assignments.length || !machines.length) return 0;
    const totalScheduledMin = assignments.reduce((sum, a) => sum + a.estimatedMinutes, 0);
    const totalAvailableMin = machines.filter(m => m.isAvailable).length * 8 * 60;
    return Math.min(100, (totalScheduledMin / totalAvailableMin) * 100);
  }

  // ── Gang run candidates ──────────────────────────
  async findGangRunCandidates(jobs: ScheduleInput['jobs']): Promise<{
    groups: Array<{
      paperSize: string;
      colorMode: string;
      jobs: typeof jobs;
      savings: number;
    }>;
  }> {
    const groups = new Map<string, typeof jobs>();

    for (const job of jobs) {
      const key = `${job.paperSize ?? 'A4'}_${job.colorMode ?? 'CMYK'}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(job);
    }

    const result = [];
    for (const [key, groupJobs] of groups.entries()) {
      if (groupJobs.length < 2) continue;
      const [size, color] = key.split('_');
      const setupSavings = (groupJobs.length - 1) * 15000;

      result.push({
        paperSize: size,
        colorMode: color,
        jobs: groupJobs,
        savings: setupSavings,
      });
    }

    return { groups: result };
  }
}
