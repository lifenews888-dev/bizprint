import { Test, TestingModule } from '@nestjs/testing'
import { PrintSizeService } from './print-size.service'

describe('PrintSizeService', () => {
  let service: PrintSizeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrintSizeService],
    }).compile()
    service = module.get<PrintSizeService>(PrintSizeService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('detect() — стандарт хэмжээ', () => {
    it('A4 (210x297) таних', () => {
      const result = service.detect(210, 297)
      expect(result.detected_size).toBe('A4')
    })

    it('A3 (297x420) таних', () => {
      const result = service.detect(297, 420)
      expect(result.detected_size).toBe('A3')
    })

    it('A5 (148x210) таних', () => {
      const result = service.detect(148, 210)
      expect(result.detected_size).toBe('A5')
    })

    it('A6 (105x148) таних', () => {
      const result = service.detect(105, 148)
      expect(result.detected_size).toBe('A6')
    })
  })

  describe('detect() — эргүүлсэн хэмжээ', () => {
    it('A4 эргүүлсэн (297x210) таних', () => {
      const result = service.detect(297, 210)
      expect(result.detected_size).toBe('A4')
    })

    it('A5 эргүүлсэн (210x148) таних', () => {
      const result = service.detect(210, 148)
      expect(result.detected_size).toBe('A5')
    })

    it('A3 эргүүлсэн (420x297) таних', () => {
      const result = service.detect(420, 297)
      expect(result.detected_size).toBe('A3')
    })
  })

  describe('detect() — ±5mm хэлбэлзэл', () => {
    it('A4 + 4mm хазайлтыг зөвшөөрнө', () => {
      const result = service.detect(214, 293)
      expect(result.detected_size).toBe('A4')
    })

    it('A5 - 3mm хазайлтыг зөвшөөрнө', () => {
      const result = service.detect(145, 207)
      expect(result.detected_size).toBe('A5')
    })
  })

  describe('detect() — CUSTOM хэмжээ', () => {
    it('стандарт бус хэмжээг CUSTOM буцаана', () => {
      const result = service.detect(500, 600)
      expect(result.detected_size).toBe('CUSTOM')
    })

    it('маш жижиг хэмжээг CUSTOM буцаана', () => {
      const result = service.detect(50, 50)
      expect(result.detected_size).toBe('CUSTOM')
    })
  })

  describe('detect() — width_mm, height_mm', () => {
    it('оруулсан хэмжээг хэвээр буцаана', () => {
      const result = service.detect(210, 297)
      expect(result.width_mm).toBe(210)
      expect(result.height_mm).toBe(297)
    })

    it('CUSTOM үед ч гэсэн хэмжээг хэвээр буцаана', () => {
      const result = service.detect(333, 444)
      expect(result.width_mm).toBe(333)
      expect(result.height_mm).toBe(444)
    })
  })
})
