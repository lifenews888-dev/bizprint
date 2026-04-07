import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrintInquiry, InquiryStatus } from './entities/print-inquiry.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class PrintInquiryService {
  constructor(
    @InjectRepository(PrintInquiry) private repo: Repository<PrintInquiry>,
    @InjectRepository(ChatMessage) private chatRepo: Repository<ChatMessage>,
    private eventEmitter: EventEmitter2,
  ) {}

  private genNumber(): string {
    const y = new Date().getFullYear();
    const r = Math.floor(1000 + Math.random() * 9000);
    return `INQ-${y}-${r}`;
  }

  async create(dto: Partial<PrintInquiry>): Promise<PrintInquiry> {
    const saved = await this.repo.save(
      this.repo.create({ ...dto, inquiry_number: this.genNumber(), status: InquiryStatus.NEW }),
    );
    this.eventEmitter.emit('inquiry.created', saved);
    await this.sysMsg(saved.id, `Захиалгын хүсэлт #${saved.inquiry_number} хүлээн авлаа. Бид удахгүй холбогдоно.`);
    return saved;
  }

  findAll(f: { status?: string; category?: string } = {}): Promise<PrintInquiry[]> {
    const qb = this.repo.createQueryBuilder('i').orderBy('i.created_at', 'DESC');
    if (f.status) qb.andWhere('i.status = :s', { s: f.status });
    if (f.category) qb.andWhere('i.category = :c', { c: f.category });
    return qb.getMany();
  }

  findByCustomer(cid: string) {
    return this.repo.find({ where: { customer_id: cid }, order: { created_at: 'DESC' } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: InquiryStatus, note?: string) {
    await this.repo.update(id, { status, ...(note ? { admin_notes: note } : {}) });
    const labels: Record<string, string> = {
      reviewing: 'Захиалгыг хянаж байна',
      quoted: 'Үнийн санал бэлэн болсон',
      confirmed: 'Захиалга батлагдлаа',
      in_work: 'Хэвлэж эхэллээ',
      completed: 'Захиалга бэлэн болсон',
    };
    if (labels[status]) await this.sysMsg(id, labels[status]);
    this.eventEmitter.emit('inquiry.status', { id, status });
    return this.repo.findOne({ where: { id } });
  }

  async sendQuote(id: string, price: number, notes: string) {
    await this.repo.update(id, { quoted_price: price, status: InquiryStatus.QUOTED, admin_notes: notes });
    await this.sysMsg(id, `Үнийн санал: ${price.toLocaleString()}₮. ${notes}`);
    this.eventEmitter.emit('inquiry.quoted', { id, price });
    return this.repo.findOne({ where: { id } });
  }

  async assign(id: string, adminId: string) {
    await this.repo.update(id, { assigned_to: adminId, status: InquiryStatus.REVIEWING });
    return this.repo.findOne({ where: { id } });
  }

  getMessages(inquiryId: string) {
    return this.chatRepo.find({ where: { inquiry_id: inquiryId }, order: { created_at: 'ASC' } });
  }

  async sendMessage(dto: {
    inquiryId: string; senderId: string; senderName: string;
    senderRole: string; content: string; attachments?: any[];
  }): Promise<ChatMessage> {
    const msg = await this.chatRepo.save(
      this.chatRepo.create({
        inquiry_id: dto.inquiryId,
        sender_id: dto.senderId,
        sender_name: dto.senderName,
        sender_role: dto.senderRole,
        content: dto.content,
        attachments: dto.attachments || [],
      }),
    );
    this.eventEmitter.emit('chat.new', msg);
    return msg;
  }

  async markRead(inquiryId: string) {
    await this.chatRepo.update({ inquiry_id: inquiryId, is_read: false }, { is_read: true });
  }

  private async sysMsg(inquiryId: string, content: string) {
    await this.chatRepo.save(
      this.chatRepo.create({
        inquiry_id: inquiryId,
        sender_id: 'system',
        sender_name: 'BizPrint',
        sender_role: 'system',
        content,
        is_system: true,
      }),
    );
  }

  async getSummary() {
    const [total, newC, reviewing, quoted, unread] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: InquiryStatus.NEW } }),
      this.repo.count({ where: { status: InquiryStatus.REVIEWING } }),
      this.repo.count({ where: { status: InquiryStatus.QUOTED } }),
      this.chatRepo.count({ where: { is_read: false, sender_role: 'customer' } }),
    ]);
    return { total, new_count: newC, reviewing, quoted, unread_messages: unread };
  }
}
