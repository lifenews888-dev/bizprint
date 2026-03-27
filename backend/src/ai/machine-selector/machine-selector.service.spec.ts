import { Test, TestingModule } from '@nestjs/testing'
import { MachineSelectorService } from './machine-selector.service'

describe('MachineSelectorService', () => {
  let service: MachineSelectorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MachineSelectorService],
    }).compile()
    service = module.get<MachineSelectorService>(MachineSelectorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('select() — машин сонголт', () => {
    it('жижиг ажлыг Digital Press авна (хамгийн хямд)', () => {
      // 90x50, qty=100
      // Digital:  2000 + (100/2000)*0.5*100 = 2002.5
      // Offset:   15000 + (100/8000)*0.2*100 = 15000.25
      // LargeFormat: 5000 + (100/100)*5*100 = 5500
      const result = service.select({ width: 90, height: 50, quantity: 100 })
      expect(result.selected_machine).toBe('Digital Press')
      expect(result.machine_type).toBe('digital')
    })

    it('том хэмжээтэй, их тоо → Offset 4 Color сонгоно', () => {
      // 400x600, qty=10000
      // Digital: 400>330 → тохирохгүй
      // Offset: 15000 + (10000/8000)*0.2*10000 = 15000+2500 = 17500
      // Large:  5000 + (10000/100)*5*10000 = 5005000
      const result = service.select({ width: 400, height: 600, quantity: 10000 })
      expect(result.selected_machine).toBe('Offset 4 Color')
      expect(result.machine_type).toBe('offset')
    })

    it('маш том хэмжээг Large Format Printer авна', () => {
      // 1500x3000 → зөвхөн Large Format тохирно
      const result = service.select({ width: 1500, height: 3000, quantity: 10 })
      expect(result.selected_machine).toBe('Large Format Printer')
      expect(result.machine_type).toBe('large_format')
    })

    it('ямар ч машин тохирохгүй бол null буцаана', () => {
      // 2000x6000 → бүх машины max_sheet-аас том
      const result = service.select({ width: 2000, height: 6000, quantity: 10 })
      expect(result.selected_machine).toBeUndefined()
      expect(result.machine_type).toBeUndefined()
    })
  })

  describe('select() — estimated_cost', () => {
    it('Digital Press зардал зөв тооцоолно', () => {
      // qty=100: 2000 + (100/2000)*0.5*100 = 2002.5
      const result = service.select({ width: 90, height: 50, quantity: 100 })
      expect(result.estimated_cost).toBeCloseTo(2002.5)
    })

    it('Offset зардал зөв тооцоолно', () => {
      // qty=10000, 400x600: 15000 + (10000/8000)*0.2*10000 = 17500
      const result = service.select({ width: 400, height: 600, quantity: 10000 })
      expect(result.estimated_cost).toBeCloseTo(17500)
    })
  })

  describe('select() — хэмжээний хязгаар', () => {
    it('Digital Press-ийн max хэмжээнд тохирно (330x480)', () => {
      const result = service.select({ width: 330, height: 480, quantity: 100 })
      expect(result.selected_machine).toBe('Digital Press')
    })

    it('Digital Press хэмжээнээс 1mm том бол тохирохгүй', () => {
      const result = service.select({ width: 331, height: 480, quantity: 100 })
      expect(result.selected_machine).not.toBe('Digital Press')
    })
  })
})
