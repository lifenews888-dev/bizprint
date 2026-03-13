import { Injectable } from '@nestjs/common'

@Injectable()
export class PrintSizeService {

  detect(width: number, height: number) {

    const sizes = [
      { name: "A6", w: 105, h: 148 },
      { name: "A5", w: 148, h: 210 },
      { name: "A4", w: 210, h: 297 },
      { name: "A3", w: 297, h: 420 }
    ]

    for (const s of sizes) {

      if (
        (Math.abs(width - s.w) < 5 && Math.abs(height - s.h) < 5) ||
        (Math.abs(width - s.h) < 5 && Math.abs(height - s.w) < 5)
      ) {
        return {
          detected_size: s.name,
          width_mm: width,
          height_mm: height
        }
      }

    }

    return {
      detected_size: "CUSTOM",
      width_mm: width,
      height_mm: height
    }

  }

}