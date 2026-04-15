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
import { PrintInquiryService } from './print-inquiry.service';
import { InquiryStatus } from './entities/print-inquiry.entity';

const uploadStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dest = join(process.cwd(), 'uploads', 'inquiries');
    mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (file.originalname.match(/\.(pdf|ai|psd|jpg|jpeg|png|webp|eps|zip)$/i)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Зөвшөөрөгдөөгүй файлын төрөл'), false);
  }
};

@Controller('inquiries')
export class PrintInquiryController {
  constructor(private readonly svc: PrintInquiryService) {}

  // — PUBLIC: Create inquiry —
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
      quantity: body.quantity ? +body.quantity : null,
      width_mm: body.width_mm ? +body.width_mm : null,
      height_mm: body.height_mm ? +body.height_mm : null,
      has_design: body.has_design === 'true',
      needs_design: body.needs_design === 'true',
      finishing: body.finishing ? JSON.parse(body.finishing || '[]') : [],
      files: uploadedFiles,
    });
  }

  // — PUBLIC: Track by number —
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

  // — CUSTOMER —
  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMy(@Request() req: any) {
    return this.svc.findByCustomer(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  // — CHAT —
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
      senderId: req.user?.id || 'guest',
      senderName: body.sender_name || req.user?.name || 'Харилцагч',
      senderRole: req.user?.role === 'admin' ? 'admin' : 'customer',
      content: body.content,
      attachments,
    });
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string) {
    return this.svc.markRead(id);
  }

  // — ADMIN —
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

  // ─── Vendor accept/reject workflow ───
  @Post(':id/vendor-accept')
  @UseGuards(JwtAuthGuard)
  vendorAccept(@Param('id') id: string, @Request() req: any) {
    return this.svc.vendorAccept(id, req.user.id);
  }

  @Post(':id/vendor-reject')
  @UseGuards(JwtAuthGuard)
  vendorReject(@Param('id') id: string, @Request() req: any) {
    return this.svc.vendorReject(id, req.user.id);
  }
}
