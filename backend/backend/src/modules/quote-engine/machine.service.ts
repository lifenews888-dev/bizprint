import { Injectable } from '@nestjs/common';

@Injectable()
export class MachineService {
  select(specs: any, quantity: number) {
    if (quantity > 500) {
      return {
        type: 'offset',
        speed: 1000,
      };
    }

    return {
      type: 'digital',
      speed: 200,
    };
  }
}
