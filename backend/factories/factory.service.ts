import { Injectable } from '@nestjs/common'

@Injectable()
export class FactoryService {

  factories = [
    {
      id: 1,
      name: "UB Print Factory",
      location: "Ulaanbaatar",
      machine: "Production Digital Press",
      capacity_per_day: 10000,
      base_cost: 1,
      queue_load: 0.3
    },
    {
      id: 2,
      name: "City Offset",
      location: "Ulaanbaatar",
      machine: "Offset Press",
      capacity_per_day: 50000,
      base_cost: 0.7,
      queue_load: 0.5
    },
    {
      id: 3,
      name: "Express Digital",
      location: "Ulaanbaatar",
      machine: "Digital Press",
      capacity_per_day: 5000,
      base_cost: 1.2,
      queue_load: 0.2
    }
  ]

  selectFactory(machine: string, quantity: number) {

    const compatible = this.factories.filter(f => f.machine === machine)

    if (compatible.length === 0) {
      return null
    }

    let best = compatible[0]
    let bestScore = this.scoreFactory(best, quantity)

    for (const f of compatible) {

      const score = this.scoreFactory(f, quantity)

      if (score < bestScore) {
        best = f
        bestScore = score
      }

    }

    return best
  }

  scoreFactory(factory: any, quantity: number) {

    const capacityFactor = quantity / factory.capacity_per_day
    const queueFactor = factory.queue_load
    const costFactor = factory.base_cost

    return capacityFactor + queueFactor + costFactor

  }

}