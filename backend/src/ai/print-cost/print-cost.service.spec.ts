import { Test, TestingModule } from '@nestjs/testing'
import { PrintCostService } from './print-cost.service'

describe('PrintCostService', () => {
  let service: PrintCostService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrintCostService],
    }).compile()
    service = module.get<PrintCostService>(PrintCostService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculate()', () => {
    it('материалын зардал зөв тооцоолно', () => {
      const result = service.calculate({
        sheet_cost: 1200,
        total_sheets: 100,
        machine_cost_per_hour: 60000,
        production_minutes: 30,
      })
      // 1200 * 100 = 120000
      expect(result.material_cost).toBe(120000)
    })

    it('машины зардал зөв тооцоолно', () => {
      const result = service.calculate({
        sheet_cost: 1200,
        total_sheets: 100,
        machine_cost_per_hour: 60000,
        production_minutes: 30,
      })
      // (60000 / 60) * 30 = 30000
      expect(result.machine_cost).toBe(30000)
    })

    it('base_cost = материал + машин', () => {
      const result = service.calculate({
        sheet_cost: 1200,
        total_sheets: 100,
        machine_cost_per_hour: 60000,
        production_minutes: 30,
      })
      // 120000 + 30000 = 150000
      expect(result.base_cost).toBe(150000)
    })

    it('margin = base_cost-ийн 30%', () => {
      const result = service.calculate({
        sheet_cost: 1200,
        total_sheets: 100,
        machine_cost_per_hour: 60000,
        production_minutes: 30,
      })
      expect(result.margin).toBe(45000)
    })

    it('final_price = base_cost + margin', () => {
      const result = service.calculate({
        sheet_cost: 1200,
        total_sheets: 100,
        machine_cost_per_hour: 60000,
        production_minutes: 30,
      })
      expect(result.final_price).toBe(195000)
    })

    it('sheet_cost=0 бол материалын зардал 0', () => {
      const result = service.calculate({
        sheet_cost: 0,
        total_sheets: 500,
        machine_cost_per_hour: 120000,
        production_minutes: 60,
      })
      expect(result.material_cost).toBe(0)
      // (120000/60)*60 = 120000
      expect(result.machine_cost).toBe(120000)
    })

    it('production_minutes=0 бол машины зардал 0', () => {
      const result = service.calculate({
        sheet_cost: 500,
        total_sheets: 10,
        machine_cost_per_hour: 60000,
        production_minutes: 0,
      })
      expect(result.machine_cost).toBe(0)
      expect(result.material_cost).toBe(5000)
    })

    it('жижиг захиалга — 50 хуудас, 20 минут', () => {
      const result = service.calculate({
        sheet_cost: 800,
        total_sheets: 50,
        machine_cost_per_hour: 48000,
        production_minutes: 20,
      })
      // material: 800*50=40000
      // machine: (48000/60)*20=16000
      // base: 56000, margin: 16800, final: 72800
      expect(result.material_cost).toBe(40000)
      expect(result.machine_cost).toBeCloseTo(16000)
      expect(result.base_cost).toBeCloseTo(56000)
      expect(result.final_price).toBeCloseTo(72800)
    })
  })
})
