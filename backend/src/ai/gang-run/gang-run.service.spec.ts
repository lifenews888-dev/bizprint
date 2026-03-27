import { Test, TestingModule } from '@nestjs/testing'
import { GangRunService } from './gang-run.service'

describe('GangRunService', () => {
  let service: GangRunService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GangRunService],
    }).compile()
    service = module.get<GangRunService>(GangRunService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('optimize() — нэг захиалга', () => {
    it('5000 ширхэг, багтаамж 20 → 250 хуудас', () => {
      const result = service.optimize([{ id: 1, quantity: 5000 }], 20)
      expect(result.total_sheets).toBe(250)
    })

    it('ямар ч хуудсанд дутуу дүүргэлт байхгүй (тэгш хуваагддаг)', () => {
      const result = service.optimize([{ id: 1, quantity: 100 }], 10)
      expect(result.total_sheets).toBe(10)
      // бүх хуудсыг шалга
      result.sheets.forEach(sheet => {
        const total = sheet.reduce((sum, item) => sum + item.qty, 0)
        expect(total).toBe(10)
      })
    })

    it('тэгш бус хуваагдвал сүүлийн хуудас дутуу байна', () => {
      // 25 ширхэг / 10 багтаамж = 2 бүтэн + 1 дутуу (5)
      const result = service.optimize([{ id: 1, quantity: 25 }], 10)
      expect(result.total_sheets).toBe(3)
      const lastSheet = result.sheets[result.sheets.length - 1]
      const lastQty = lastSheet.reduce((sum, item) => sum + item.qty, 0)
      expect(lastQty).toBe(5)
    })
  })

  describe('optimize() — олон захиалга', () => {
    it('хоёр захиалга нэг хуудсанд багтана', () => {
      // qty=5, qty=5, capacity=10 → 1 хуудас
      const result = service.optimize(
        [{ id: 1, quantity: 5 }, { id: 2, quantity: 5 }],
        10
      )
      expect(result.total_sheets).toBe(1)
      expect(result.sheets[0].length).toBe(2)
    })

    it('нийт qty зөв хуудсанд тараагдана', () => {
      // qty=7+8=15, capacity=5 → 3 хуудас
      const result = service.optimize(
        [{ id: 1, quantity: 7 }, { id: 2, quantity: 8 }],
        5
      )
      expect(result.total_sheets).toBe(3)
    })

    it('бүх хуудасны нийт qty = оруулсан нийт qty', () => {
      const orders = [
        { id: 1, quantity: 300 },
        { id: 2, quantity: 450 },
        { id: 3, quantity: 250 },
      ]
      const result = service.optimize(orders, 100)
      const totalProcessed = result.sheets
        .flat()
        .reduce((sum, item) => sum + item.qty, 0)
      expect(totalProcessed).toBe(1000)
    })
  })

  describe('optimize() — буцааж өгөх утгууд', () => {
    it('sheet_capacity-г хэвээр буцаана', () => {
      const result = service.optimize([{ id: 1, quantity: 50 }], 20)
      expect(result.sheet_capacity).toBe(20)
    })

    it('хоосон захиалга → 0 хуудас', () => {
      const result = service.optimize([], 20)
      expect(result.total_sheets).toBe(0)
      expect(result.sheets).toHaveLength(0)
    })
  })
})
