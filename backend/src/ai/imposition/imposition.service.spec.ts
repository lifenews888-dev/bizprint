import { Test, TestingModule } from '@nestjs/testing'
import { ImpositionService } from './imposition.service'

describe('ImpositionService', () => {
  let service: ImpositionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImpositionService],
    }).compile()
    service = module.get<ImpositionService>(ImpositionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculate() — A3 хуудсанд A5 хэмжээ', () => {
    // Sheet 297x420, item 148x210
    // normal:  floor(297/148)=2, floor(420/210)=2 → total=4
    // rotated: floor(297/210)=1, floor(420/148)=2 → total=2
    // best: normal (4 > 2)

    it('normal тавилтад нийт 4 ширхэг багтана', () => {
      const result = service.calculate(297, 420, 148, 210)
      expect(result.layouts.normal.total).toBe(4)
    })

    it('best_layout нь NORMAL байна', () => {
      const result = service.calculate(297, 420, 148, 210)
      expect(result.best_layout.orientation).toBe('NORMAL')
      expect(result.best_layout.total_per_sheet).toBe(4)
    })
  })

  describe('calculate() — A3 хуудсанд A6 хэмжээ', () => {
    // Sheet 297x420, item 105x148
    // normal:  floor(297/105)=2, floor(420/148)=2 → total=4
    // rotated: floor(297/148)=2, floor(420/105)=4 → total=8
    // best: rotated (8 > 4)

    it('rotated тавилтад нийт 8 ширхэг багтана', () => {
      const result = service.calculate(297, 420, 105, 148)
      expect(result.layouts.rotated.total).toBe(8)
    })

    it('best_layout нь ROTATED байна', () => {
      const result = service.calculate(297, 420, 105, 148)
      expect(result.best_layout.orientation).toBe('ROTATED')
      expect(result.best_layout.total_per_sheet).toBe(8)
    })
  })

  describe('calculate() — тэгш хэмжээ', () => {
    // Sheet 400x400, item 200x200
    // normal: 2x2=4, rotated: 2x2=4 → тэнцүү, normal

    it('тэгш тавилтад normal сонгогдоно', () => {
      const result = service.calculate(400, 400, 200, 200)
      expect(result.best_layout.orientation).toBe('NORMAL')
      expect(result.best_layout.total_per_sheet).toBe(4)
    })
  })

  describe('calculate() — sheet, item мэдээлэл', () => {
    it('sheet хэмжээг хэвээр буцаана', () => {
      const result = service.calculate(297, 420, 148, 210)
      expect(result.sheet.width).toBe(297)
      expect(result.sheet.height).toBe(420)
    })

    it('item хэмжээг хэвээр буцаана', () => {
      const result = service.calculate(297, 420, 148, 210)
      expect(result.item.width).toBe(148)
      expect(result.item.height).toBe(210)
    })
  })

  describe('calculate() — хаягдал талбай', () => {
    it('best_layout дахь waste_area тооцоолно', () => {
      // Sheet 297x420, item 148x210, normal: 2x2
      // usedW=296, usedH=420, wasteArea = 297*420 - 296*420 = 420
      const result = service.calculate(297, 420, 148, 210)
      expect(result.best_layout.waste_area).toBe(420)
    })
  })
})
