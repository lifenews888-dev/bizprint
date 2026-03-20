import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  calculate(specs: any, machine: any, quantity: number) {
    const costPerPage = specs.color === 'BW' ? 15 : 50;

    const materialCost = specs.pages * costPerPage * quantity;
    const machineCost = machine.type === 'offset' ? 5000 : 2000;
    const laborCost = 3000;
    const margin = 0.2;

    const total =
      (materialCost + machineCost + laborCost) * (1 + margin);

    return {
      materialCost,
      machineCost,
      laborCost,
      total: Math.round(total),
    };
  }
}
