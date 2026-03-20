import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { QuoteV2 } from './quote-v2.entity';

@Injectable()
export class QuotesV2Service {
  constructor(
    @InjectRepository(QuoteV2)
    private repo: Repository<QuoteV2>,
  ) {}

  async generateNumber(): Promise<string> {
    const today = new Date();
    const d = today.toISOString().slice(0,10).replace(/-/g,'');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ms = String(Date.now()).slice(-4);
    return 'QT-' + d + '-' + ms + rand;
  }

  async create(data: Partial<QuoteV2>): Promise<QuoteV2> {
    const quote_number = await this.generateNumber();
    const valid_until = new Date();
    valid_until.setDate(valid_until.getDate() + 3);
    const q = this.repo.create({ ...data, quote_number, valid_until, status: 'sent' });
    return this.repo.save(q);
  }

  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByNumber(quote_number: string) {
    return this.repo.findOne({ where: { quote_number } });
  }

  async findToday() {
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    return this.repo.find({
      where: { created_at: Between(start, end) },
      order: { created_at: 'ASC' },
    });
  }

  async update(id: string, data: Partial<QuoteV2>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  findByEmail(email: string) {
    return this.repo.find({
      where: { customer_email: email },
      order: { created_at: 'DESC' },
    });
  }

  findByUserId(userId: string) {
    return this.repo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.repo.update(id, { status });
    return this.findOne(id);
  }

  async markExpired() {
    const now = new Date();
    await this.repo
      .createQueryBuilder()
      .update(QuoteV2)
      .set({ status: 'expired' })
      .where('valid_until < :now AND status NOT IN (:...statuses)', {
        now, statuses: ['ordered', 'expired'],
      })
      .execute();
  }
}