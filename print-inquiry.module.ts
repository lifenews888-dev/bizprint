// ============================================================
// print-inquiry.service.ts
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
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
      this.repo.create({ ...dto, inquiry_number: this.genNumber(), status: InquiryStatus.NEW })
    );
    this.eventEmitter.emit('inquiry.created', saved);
    await this.sysMsg(saved.id, `Захиалгын хүсэлт #${saved.inquiry_number} хүлээн авлаа. Бид удахгүй холбогдоно.`);
    return saved;
  }

  findAll(f: { status?: string; category?: string } = {}): Promise<PrintInquiry[]> {
    const qb = this.repo.createQueryBuilder('i').orderBy('i.created_at', 'DESC');
    if (f.status)   qb.andWhere('i.status = :s', { s: f.status });
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
    const msg = await this.chatRepo.save(this.chatRepo.create({
      inquiry_id: dto.inquiryId,
      sender_id: dto.senderId,
      sender_name: dto.senderName,
      sender_role: dto.senderRole,
      content: dto.content,
      attachments: dto.attachments || [],
    }));
    this.eventEmitter.emit('chat.new', msg);
    return msg;
  }

  async markRead(inquiryId: string) {
    await this.chatRepo.update({ inquiry_id: inquiryId, is_read: false }, { is_read: true });
  }

  private async sysMsg(inquiryId: string, content: string) {
    await this.chatRepo.save(this.chatRepo.create({
      inquiry_id: inquiryId,
      sender_id: 'system', sender_name: 'BizPrint',
      sender_role: 'system', content, is_system: true,
    }));
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


// ============================================================
// print-inquiry.controller.ts
// ============================================================
import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Request, UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { InquiryStatus } from './entities/print-inquiry.entity';

const uploadStorage = diskStorage({
  destination: (req, file, cb) => {
    const dest = join(process.cwd(), 'uploads', 'inquiries');
    mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.originalname.match(/\.(pdf|ai|psd|jpg|jpeg|png|webp|eps|zip)$/i)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Зөвшөөрөгдөөгүй файлын төрөл'), false);
  }
};

@Controller('inquiries')
export class PrintInquiryController {
  constructor(private readonly svc: PrintInquiryService) {}

  // ── PUBLIC: Захиалга үүсгэх ────────────────────────────
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 5, {
    storage: uploadStorage, fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async create(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    const uploadedFiles = (files || []).map(f => ({
      name: f.originalname, size: f.size, type: f.mimetype,
      url: `/api/uploads/inquiries/${f.filename}`,
      uploaded_at: new Date().toISOString(),
    }));

    return this.svc.create({
      ...body,
      customer_id: req.user?.id || null,
      quantity:    body.quantity ? +body.quantity : null,
      width_mm:    body.width_mm ? +body.width_mm : null,
      height_mm:   body.height_mm ? +body.height_mm : null,
      has_design:  body.has_design === 'true',
      needs_design: body.needs_design === 'true',
      finishing:   body.finishing ? JSON.parse(body.finishing || '[]') : [],
      files:       uploadedFiles,
    });
  }

  // ── PUBLIC: Дугаараар статус шалгах ────────────────────
  @Get('track/:number')
  async track(@Param('number') number: string) {
    const list = await this.svc.findAll({});
    const item = list.find(i => i.inquiry_number === number);
    if (!item) return { found: false };
    return {
      found: true,
      inquiry_number: item.inquiry_number,
      status: item.status,
      product_name: item.product_name,
      created_at: item.created_at,
      quoted_price: item.quoted_price,
    };
  }

  // ── CUSTOMER ───────────────────────────────────────────
  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMy(@Request() req: any) {
    return this.svc.findByCustomer(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  // ── CHAT ───────────────────────────────────────────────
  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.svc.getMessages(id);
  }

  @Post(':id/messages')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FilesInterceptor('attachments', 3, {
    storage: uploadStorage, fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 },
  }))
  async sendMessage(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    const attachments = (files || []).map(f => ({
      name: f.originalname, type: f.mimetype,
      url: `/api/uploads/inquiries/${f.filename}`,
    }));
    return this.svc.sendMessage({
      inquiryId: id,
      senderId:   req.user?.id || 'guest',
      senderName: body.sender_name || req.user?.name || 'Харилцагч',
      senderRole: req.user?.role === 'admin' ? 'admin' : 'customer',
      content:    body.content,
      attachments,
    });
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string) {
    return this.svc.markRead(id);
  }

  // ── ADMIN ──────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(@Query('status') status?: string, @Query('category') category?: string) {
    return this.svc.findAll({ status, category });
  }

  @Get('admin/summary')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getSummary() {
    return this.svc.getSummary();
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, AdminGuard)
  assign(@Param('id') id: string, @Body('admin_id') adminId: string) {
    return this.svc.assign(id, adminId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: InquiryStatus,
    @Body('note') note?: string,
  ) {
    return this.svc.updateStatus(id, status, note);
  }

  @Post(':id/quote')
  @UseGuards(JwtAuthGuard, AdminGuard)
  sendQuote(
    @Param('id') id: string,
    @Body('price') price: number,
    @Body('notes') notes: string,
  ) {
    return this.svc.sendQuote(id, price, notes);
  }
}


// ============================================================
// chat.gateway.ts
// ============================================================
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'inquiry-chat', cors: { origin: '*' } })
export class InquiryChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const id = client.handshake.query.inquiry_id as string;
    if (id) client.join(`inq:${id}`);
  }

  @SubscribeMessage('join')
  join(@ConnectedSocket() c: Socket, @MessageBody() d: { inquiry_id: string }) {
    c.join(`inq:${d.inquiry_id}`);
    return { ok: true };
  }

  @SubscribeMessage('admin_join')
  adminJoin(@ConnectedSocket() c: Socket) {
    c.join('admins');
    return { ok: true };
  }

  @SubscribeMessage('typing')
  typing(@ConnectedSocket() c: Socket, @MessageBody() d: { inquiry_id: string; name: string }) {
    c.to(`inq:${d.inquiry_id}`).emit('typing', { name: d.name });
  }

  broadcastMsg(inquiryId: string, msg: any) {
    this.server.to(`inq:${inquiryId}`).emit('message', msg);
  }

  notifyAdmin(event: string, data: any) {
    this.server.to('admins').emit(event, data);
  }
}


// ============================================================
// print-inquiry.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintInquiry } from './entities/print-inquiry.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrintInquiry, ChatMessage])],
  controllers: [PrintInquiryController],
  providers: [PrintInquiryService, InquiryChatGateway],
  exports: [PrintInquiryService, InquiryChatGateway],
})
export class PrintInquiryModule {}
