import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ColorCode } from './entities/color-code.entity'
import { PrintProductType } from './entities/print-product-type.entity'
import { SEED_COLORS, SEED_PRODUCT_TYPES } from './seed-data'

/**
 * Каталог хоосон бол эхний өнгө, хэвлэлийн төрлүүдийг оруулна.
 * Зөвхөн ХООСОН хүснэгтэд бичнэ (админы засварыг дарж бичихгүй).
 * Алдаа гарвал boot-ыг унагаахгүй, зөвхөн лог бичнэ.
 */
@Injectable()
export class PrintNetworkSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PrintNetworkSeedService.name)

  constructor(
    @InjectRepository(ColorCode) private colors: Repository<ColorCode>,
    @InjectRepository(PrintProductType) private productTypes: Repository<PrintProductType>,
  ) {}

  async onApplicationBootstrap() {
    try {
      if ((await this.colors.count()) === 0) {
        await this.colors.insert(SEED_COLORS)
        this.logger.log(`Seeded ${SEED_COLORS.length} color codes`)
      }
      if ((await this.productTypes.count()) === 0) {
        await this.productTypes.insert(SEED_PRODUCT_TYPES)
        this.logger.log(`Seeded ${SEED_PRODUCT_TYPES.length} print product types`)
      }
    } catch (e: any) {
      this.logger.warn(`Print network seed skipped: ${e?.message ?? e}`)
    }
  }
}
