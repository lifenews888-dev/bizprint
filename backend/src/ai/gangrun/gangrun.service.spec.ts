import { Test, TestingModule } from '@nestjs/testing'
import { GangrunService } from './gangrun.service'

describe('GangrunService', () => {
  let service: GangrunService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GangrunService],
    }).compile()
    service = module.get<GangrunService>(GangrunService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculate() — нийт захиалга ба хуудас', () => {
    it('нийт qty зөв нэмэгдэнэ', () => {
      const result = service.calculate({
        sheetCapacity: 20,
        orders: [100, 150, 200],
      })
      expect(result.total_orders).toBe(450)
    })

    it('шаардлагатай хуудасны тоо дээш тойруулна', () => {
      // 450 / 20 = 22.5 → 23
      const result = service.calculate({
        sheetCapacity: 20,
        orders: [100, 150, 200],
      })
      expect(result.sheets_needed).toBe(23)
    })

    it('хаягдал capacity зөв тооцоолно', () => {
      // 23*20 - 450 = 10
      const result = service.calculate({
        sheetCapacity: 20,
        orders: [100, 150, 200],
      })
      expect(result.waste_capacity).toBe(10)
    })

    it('тэгш хуваагдвал хаягдал 0', () => {
      // 100+100+100=300, 300/10=30 хуудас, хаягдал=0
      const result = service.calculate({
        sheetCapacity: 10,
        orders: [100, 100, 100],
      })
      expect(result.sheets_needed).toBe(30)
      expect(result.waste_capacity).toBe(0)
    })

    it('sheet_capacity буцаана', () => {
      const result = service.calculate({
        sheetCapacity: 50,
        orders: [200],
      })
      expect(result.sheet_capacity).toBe(50)
    })
  })

  describe('calculate() — хилийн нөхцөл', () => {
    it('нэг л захиалга байвал зөв тооцоолно', () => {
      const result = service.calculate({
        sheetCapacity: 100,
        orders: [500],
      })
      expect(result.total_orders).toBe(500)
      expect(result.sheets_needed).toBe(5)
      expect(result.waste_capacity).toBe(0)
    })

    it('orders нь массив биш бол алдаа буцаана', () => {
      const result = service.calculate({
        sheetCapacity: 10,
        orders: 'wrong' as any,
      })
      expect(result).toHaveProperty('error')
    })

    it('нэг ширхэг захиалга — 1 хуудас', () => {
      const result = service.calculate({
        sheetCapacity: 100,
        orders: [1],
      })
      expect(result.sheets_needed).toBe(1)
      expect(result.waste_capacity).toBe(99)
    })
  })
})
