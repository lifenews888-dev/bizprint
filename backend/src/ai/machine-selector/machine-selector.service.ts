import { Injectable } from '@nestjs/common'

@Injectable()
export class MachineSelectorService {

  machines = [

    {
      name: 'Digital Press',
      type: 'digital',
      max_sheet: [330, 480],
      speed_per_hour: 2000,
      setup_cost: 2000,
      run_cost: 0.5
    },

    {
      name: 'Offset 4 Color',
      type: 'offset',
      max_sheet: [520, 740],
      speed_per_hour: 8000,
      setup_cost: 15000,
      run_cost: 0.2
    },

    {
      name: 'Large Format Printer',
      type: 'large_format',
      max_sheet: [1600, 5000],
      speed_per_hour: 100,
      setup_cost: 5000,
      run_cost: 5
    }

  ]

  select(job: any) {

    let bestMachine: any = null

    for (const machine of this.machines) {

      const fits =
        job.width <= machine.max_sheet[0] &&
        job.height <= machine.max_sheet[1]

      if (!fits) continue

      const productionHours = job.quantity / machine.speed_per_hour

      const cost =
        machine.setup_cost +
        productionHours * machine.run_cost * job.quantity

      if (!bestMachine || cost < bestMachine.cost) {

        bestMachine = {
          ...machine,
          cost
        }

      }

    }

    return {
      selected_machine: bestMachine?.name,
      machine_type: bestMachine?.type,
      estimated_cost: bestMachine?.cost
    }

  }

}