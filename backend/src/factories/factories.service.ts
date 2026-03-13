import { Injectable } from '@nestjs/common'

interface Factory {
  id: number
  name: string
  machine_type: string
  speed_per_hour: number
  setup_cost: number
  run_cost: number
  current_load: number
}

@Injectable()
export class FactoriesService {

  factories: Factory[] = [
    {
      id: 1,
      name: "Print Factory A",
      machine_type: "Digital Press",
      speed_per_hour: 5000,
      setup_cost: 200,
      run_cost: 0.05,
      current_load: 20
    },
    {
      id: 2,
      name: "Print Factory B",
      machine_type: "Offset Press",
      speed_per_hour: 10000,
      setup_cost: 500,
      run_cost: 0.02,
      current_load: 50
    },
    {
      id: 3,
      name: "Print Factory C",
      machine_type: "Digital Press",
      speed_per_hour: 3000,
      setup_cost: 150,
      run_cost: 0.06,
      current_load: 10
    }
  ]

  selectBestFactory(machineType: string, quantity: number) {

    let bestFactory: Factory | null = null
    let bestScore = Infinity

    for (const factory of this.factories) {

      if (factory.machine_type !== machineType) continue

      const productionTime = quantity / factory.speed_per_hour

      const loadPenalty = factory.current_load * 2

      const score =
        factory.setup_cost +
        (quantity * factory.run_cost) +
        productionTime +
        loadPenalty

      if (score < bestScore) {
        bestScore = score
        bestFactory = factory
      }

    }

    return bestFactory
  }

}