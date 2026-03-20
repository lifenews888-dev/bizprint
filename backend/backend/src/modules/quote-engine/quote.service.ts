import { Injectable } from '@nestjs/common';
import { ParserService } from './parser.service';
import { PricingService } from './pricing.service';
import { MachineService } from './machine.service';

@Injectable()
export class QuoteService {
  constructor(
    private parser: ParserService,
    private pricing: PricingService,
    private machine: MachineService,
  ) {}

  async analyze(fileUrl: string, quantity: number) {
    const specs = await this.parser.parse(fileUrl);
    const machine = this.machine.select(specs, quantity);
    const price = this.pricing.calculate(specs, machine, quantity);

    return {
      specs,
      machine,
      price,
    };
  }
}
